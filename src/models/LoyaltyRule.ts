import { Schema, model } from 'mongoose';
export type RuleType='purchase'|'signup'|'birthday'|'review'|'referral';
export interface ILoyaltyRule {shopDomain:string;name:string;type:RuleType;pointsPerAmount?:number;flatPoints?:number;minSpend?:number;isActive:boolean;createdAt:Date;updatedAt:Date}
const schema=new Schema<ILoyaltyRule>({shopDomain:{type:String,required:true,index:true},name:{type:String,required:true},type:{type:String,enum:['purchase','signup','birthday','review','referral'],required:true},pointsPerAmount:{type:Number,min:0},flatPoints:{type:Number,min:0},minSpend:{type:Number,min:0},isActive:{type:Boolean,default:true}},{timestamps:true});
export const LoyaltyRule=model<ILoyaltyRule>('LoyaltyRule',schema);
