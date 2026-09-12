import { Session } from '@shopify/shopify-api';
import { shopify } from '../config/shopify';
import { IReward } from '../models/Reward';
import { IShop } from '../models/Shop';
import { HydratedDocument } from 'mongoose';
import { AppError } from '../utils/AppError';
import { logger } from '../config/logger';
function client(shop:HydratedDocument<IShop>){const session=new Session({id:`offline_${shop.shopDomain}`,shop:shop.shopDomain,state:'',isOnline:false,accessToken:shop.accessToken});return new shopify.clients.Graphql({session});}
export async function findShopifyCustomerByEmail(shop:HydratedDocument<IShop>,email:string){const response:any=await client(shop).request(`query($query:String!){customers(first:1,query:$query){nodes{id email displayName}}}`,{variables:{query:`email:${email}`}});return response.data?.customers?.nodes?.[0]||null;}
export async function createDiscountCode(shop:HydratedDocument<IShop>,reward:HydratedDocument<IReward>,email:string){const linked=await findShopifyCustomerByEmail(shop,email);if(!linked?.id)throw new AppError('A matching Shopify customer is required to redeem rewards',422,'SHOPIFY_CUSTOMER_REQUIRED');const code=`LOYALTY-${Math.random().toString(36).slice(2,10).toUpperCase()}`;let query:string,variables:any;const customerSelection={customers:{add:[linked.id]}};if(reward.type==='free_shipping'){query=`mutation($input:DiscountCodeFreeShippingInput!){discountCodeFreeShippingCreate(freeShippingCodeDiscount:$input){codeDiscountNode{id} userErrors{message}}}`;variables={input:{title:reward.name,code,customerSelection,startsAt:new Date().toISOString(),usageLimit:1,appliesOncePerCustomer:true}};}else{const value=reward.type==='percentage_discount'?{percentage:Number(reward.value||0)/100}:reward.type==='free_product'?{percentage:1}:{discountAmount:{amount:Number(reward.value||0),appliesOnEachItem:false}};const items=reward.type==='free_product'?{products:{productsToAdd:[reward.freeProductId]}}:{all:true};query=`mutation($input:DiscountCodeBasicInput!){discountCodeBasicCreate(basicCodeDiscount:$input){codeDiscountNode{id} userErrors{message}}}`;variables={input:{title:reward.name,code,customerSelection,customerGets:{value,items},startsAt:new Date().toISOString(),usageLimit:1,appliesOncePerCustomer:true}};}const response:any=await client(shop).request(query,{variables});const result=response.data?.discountCodeFreeShippingCreate||response.data?.discountCodeBasicCreate;if(result?.userErrors?.length)throw new AppError(result.userErrors.map((e:any)=>e.message).join(', '),502,'SHOPIFY_ERROR');if(!result?.codeDiscountNode?.id)throw new AppError('Shopify did not create a discount',502,'SHOPIFY_ERROR');return{code,id:result.codeDiscountNode.id};}
export async function registerWebhooks(shop:HydratedDocument<IShop>,appUrl:string){
  const graphql=client(shop),baseUrl=appUrl.replace(/\/$/,''),topics=[['ORDERS_CREATE','orders/create'],['ORDERS_PAID','orders/paid'],['ORDERS_UPDATED','orders/updated'],['ORDERS_CANCELLED','orders/cancelled'],['REFUNDS_CREATE','orders/refunded'],['CUSTOMERS_CREATE','customers/create'],['APP_UNINSTALLED','app/uninstalled']] as const;
  const current:any=await graphql.request(`query{webhookSubscriptions(first:100){nodes{id topic uri}}}`);
  if(current.errors?.length)throw new AppError(`Unable to list webhooks: ${current.errors.map((error:any)=>error.message).join(', ')}`,502,'SHOPIFY_ERROR');
  const subscriptions:Array<{id:string;topic:string;uri:string}>=current.data?.webhookSubscriptions?.nodes||[];
  const failures:string[]=[];
  for(const[topic,path]of topics){
    try{
      const uri=`${baseUrl}/webhooks/${path}`;
      if(subscriptions.some(subscription=>subscription.topic===topic&&subscription.uri===uri))continue;
      const response:any=await graphql.request(`mutation($topic:WebhookSubscriptionTopic!,$sub:WebhookSubscriptionInput!){webhookSubscriptionCreate(topic:$topic,webhookSubscription:$sub){webhookSubscription{id topic uri} userErrors{field message}}}`,{variables:{topic,sub:{uri,format:'JSON'}}});
      const result=response.data?.webhookSubscriptionCreate,errors=[...(response.errors||[]),...(result?.userErrors||[])];
      if(errors.length||!result?.webhookSubscription?.id)throw new Error(errors.map((error:any)=>error.message).join(', ')||'Shopify returned no subscription');
      for(const stale of subscriptions.filter(subscription=>subscription.topic===topic&&subscription.uri!==uri)){
        const removed:any=await graphql.request(`mutation($id:ID!){webhookSubscriptionDelete(id:$id){deletedWebhookSubscriptionId userErrors{field message}}}`,{variables:{id:stale.id}});
        const removalErrors=[...(removed.errors||[]),...(removed.data?.webhookSubscriptionDelete?.userErrors||[])];
        if(removalErrors.length)throw new Error(`cleanup failed: ${removalErrors.map((error:any)=>error.message).join(', ')}`);
      }
      logger.info('webhook_subscription_registered',{shopDomain:shop.shopDomain,topic,uri});
    }catch(error:any){
      const message=`${topic}: ${error.message}`;
      failures.push(message);
      logger.warn('webhook_subscription_failed',{shopDomain:shop.shopDomain,topic,errorMessage:error.message});
    }
  }
  if(failures.length)throw new AppError(`Webhook registration failed: ${failures.join('; ')}`,502,'SHOPIFY_ERROR');
}
