import { Schema, model } from 'mongoose';
export interface IShop { shopDomain:string; accessToken:string; refreshToken?:string; tokenExpiresAt?:Date; refreshTokenExpiresAt?:Date; scope?:string; isActive:boolean; installedAt:Date; uninstalledAt?:Date; }
const schema = new Schema<IShop>({ shopDomain:{type:String,required:true,unique:true,index:true,lowercase:true}, accessToken:{type:String,required:true,select:false}, refreshToken:{type:String,select:false}, tokenExpiresAt:Date, refreshTokenExpiresAt:Date, scope:String, isActive:{type:Boolean,default:true}, installedAt:{type:Date,default:Date.now}, uninstalledAt:Date });
export const Shop = model<IShop>('Shop', schema);
