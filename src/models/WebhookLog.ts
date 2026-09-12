import { Schema, model } from 'mongoose';
const schema=new Schema({shopDomain:{type:String,required:true,index:true},webhookId:{type:String,required:true,unique:true,index:true},topic:{type:String,required:true},status:{type:String,enum:['pending','processed','failed'],required:true},receivedAt:{type:Date,default:Date.now},failureReason:String});
export const WebhookLog=model('WebhookLog',schema);
