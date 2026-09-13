import { Schema, model } from 'mongoose';

interface IAwardClaim {shopDomain:string;source:string;referenceId:string;createdAt:Date}

const schema=new Schema<IAwardClaim>({shopDomain:{type:String,required:true},source:{type:String,required:true},referenceId:{type:String,required:true}},{timestamps:{createdAt:true,updatedAt:false}});
schema.index({shopDomain:1,source:1,referenceId:1},{unique:true});

export const AwardClaim=model<IAwardClaim>('AwardClaim',schema);
