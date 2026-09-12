import { WebhookLog } from '../models/WebhookLog';
export async function claimWebhook(shopDomain:string,webhookId:string,topic:string){try{await WebhookLog.create({shopDomain,webhookId,topic,status:'pending'});return true;}catch(err:any){if(err?.code!==11000)throw err;const reclaimed=await WebhookLog.findOneAndUpdate({webhookId,status:'failed'},{$set:{status:'pending',topic,shopDomain,receivedAt:new Date()},$unset:{failureReason:1}},{new:true});return Boolean(reclaimed);}}
export const completeWebhook=(webhookId:string)=>WebhookLog.updateOne({webhookId},{$set:{status:'processed'}});
export const failWebhook=(webhookId:string,failureReason:string)=>WebhookLog.updateOne({webhookId,status:'pending'},{$set:{status:'failed',failureReason:failureReason.slice(0,1000)}});
