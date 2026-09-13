import { RequestedTokenType } from '@shopify/shopify-api';
import { HydratedDocument } from 'mongoose';
import { logger } from '../config/logger';
import { shopify } from '../config/shopify';
import { IShop, Shop } from '../models/Shop';
import { registerWebhooks } from './shopifyGraphqlService';
import { tokenUpdate } from './shopTokenService';

const installations=new Map<string,Promise<HydratedDocument<IShop>>>();

async function exchangeAndStore(shopDomain:string,idToken:string,appUrl:string){
  logger.info('shop_token_exchange_started',{shopDomain});
  const {session}=await shopify.auth.tokenExchange({shop:shopDomain,sessionToken:idToken,requestedTokenType:RequestedTokenType.OfflineAccessToken,expiring:true});
  if(!session.accessToken||!session.refreshToken||!session.expires)throw new Error('Shopify token exchange returned incomplete expiring token metadata');
  const stored=await Shop.findOneAndUpdate({shopDomain},{$set:{...tokenUpdate(session),installedAt:new Date()},$unset:{uninstalledAt:1}},{upsert:true,new:true}).select('+accessToken +refreshToken');
  logger.info('shop_token_exchange_completed',{shopDomain,scope:session.scope,tokenExpiresAt:session.expires,refreshTokenExpiresAt:session.refreshTokenExpires});
  try{await registerWebhooks(stored,appUrl);}
  catch(error:any){logger.error('post_install_webhook_registration_failed',{shopDomain,message:error.message});}
  return stored;
}

export function installShopFromIdToken(shopDomain:string,idToken:string,appUrl:string){
  const existing=installations.get(shopDomain);if(existing)return existing;
  const installation=exchangeAndStore(shopDomain,idToken,appUrl).finally(()=>installations.delete(shopDomain));
  installations.set(shopDomain,installation);return installation;
}
