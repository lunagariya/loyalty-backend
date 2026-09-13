import mongoose, { HydratedDocument, Types } from 'mongoose';
import { env } from '../config/env';
import { AwardClaim } from '../models/AwardClaim';
import { Customer } from '../models/Customer';
import { Transaction, ITransaction } from '../models/Transaction';
import { AppError } from '../utils/AppError';
import { tierForLifetimePoints } from './tierService';
export const calculatePurchasePoints=(total:number,pointsPerAmount:number,minSpend=0)=>total<minSpend?0:Math.floor(total/100)*pointsPerAmount;
type AwardInput={shopDomain:string;customerId:Types.ObjectId;points:number;source:ITransaction['source'];referenceId?:string;totalSpend?:number;orderAmount?:number};
type AwardResult={transaction:HydratedDocument<ITransaction>|null;created:boolean};
export async function awardPoints(input:AwardInput):Promise<AwardResult>{
  if(input.points<0||input.points===0&&!input.totalSpend)return{transaction:null,created:false};
  await AwardClaim.init();
  const session=await mongoose.startSession();let result:AwardResult={transaction:null,created:false};
  try{
    await session.withTransaction(async()=>{
      if(input.referenceId){
        const existing=await Transaction.findOne({shopDomain:input.shopDomain,source:input.source,referenceId:input.referenceId,type:'earn'}).session(session);
        if(existing){result={transaction:existing,created:false};return;}
        await AwardClaim.create([{shopDomain:input.shopDomain,source:input.source,referenceId:input.referenceId}],{session});
      }
      const customer=await Customer.findOneAndUpdate({_id:input.customerId,shopDomain:input.shopDomain},{$inc:{currentPoints:input.points,lifetimePoints:input.points,totalSpend:input.totalSpend||0}},{new:true,session});
      if(!customer)throw new AppError('Customer not found',404,'NOT_FOUND');
      const tier=tierForLifetimePoints(customer.lifetimePoints);if(customer.tier!==tier){customer.tier=tier;customer.tierUpdatedAt=new Date();await customer.save({session});}
      const expiresAt=input.points>0&&env.expirationEnabled?new Date(new Date().setMonth(new Date().getMonth()+env.expirationMonths)):undefined;
      const[transaction]=await Transaction.create([{...input,type:'earn',balanceAfter:customer.currentPoints,expiresAt}],{session});result={transaction,created:true};
    });
    return result;
  }catch(error:any){
    if(error?.code===11000&&input.referenceId){const existing=await Transaction.findOne({shopDomain:input.shopDomain,source:input.source,referenceId:input.referenceId,type:'earn'});if(existing)return{transaction:existing,created:false};}
    throw error;
  }finally{await session.endSession();}
}
export async function deductPoints(shopDomain:string,customerId:Types.ObjectId,points:number,source:ITransaction['source'],referenceId?:string){const customer=await Customer.findOneAndUpdate({_id:customerId,shopDomain,currentPoints:{$gte:points}},{$inc:{currentPoints:-points,redeemedPoints:source==='redemption'?points:0}},{new:true});if(!customer)throw new AppError('Insufficient points',409,'INSUFFICIENT_POINTS');return Transaction.create({shopDomain,customerId,type:'redeem',points:-points,source,referenceId,balanceAfter:customer.currentPoints});}
export async function reverseOrderPoints(shopDomain:string,customerId:Types.ObjectId,orderId:string,requested?:number){const earned=await Transaction.findOne({shopDomain,customerId,source:'order',referenceId:orderId,type:'earn'});if(!earned)return null;const prior=await Transaction.aggregate([{$match:{shopDomain,customerId,source:'order',referenceId:`reverse:${orderId}`,type:'adjust'}},{$group:{_id:null,total:{$sum:'$points'}}}]);const remaining=Math.max(0,earned.points+Number(prior[0]?.total||0));const amount=Math.min(remaining,requested??remaining);if(!amount)return null;const customer=await Customer.findById(customerId);if(!customer)return null;const actual=Math.min(amount,customer.currentPoints);customer.currentPoints-=actual;await customer.save();return Transaction.create({shopDomain,customerId,type:'adjust',points:-actual,source:'order',referenceId:`reverse:${orderId}`,balanceAfter:customer.currentPoints});}
