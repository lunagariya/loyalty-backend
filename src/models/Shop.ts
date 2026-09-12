import { Schema, model } from 'mongoose';
export interface IShop { shopDomain:string; accessToken:string; scope?:string; isActive:boolean; installedAt:Date; uninstalledAt?:Date; }
const schema = new Schema<IShop>({ shopDomain:{type:String,required:true,unique:true,index:true,lowercase:true}, accessToken:{type:String,required:true,select:false}, scope:String, isActive:{type:Boolean,default:true}, installedAt:{type:Date,default:Date.now}, uninstalledAt:Date });
export const Shop = model<IShop>('Shop', schema);
