import { Schema, model } from 'mongoose';
const schema=new Schema({shopDomain:{type:String,index:true},type:{type:String,enum:['webhook','api','error','job'],required:true},action:{type:String,required:true},metadata:Schema.Types.Mixed},{timestamps:{createdAt:true,updatedAt:false}});
export const ActivityLog=model('ActivityLog',schema);
