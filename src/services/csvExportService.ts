import { Response } from 'express';
import { Customer } from '../models/Customer';
import { RewardRedemption } from '../models/RewardRedemption';
import { Transaction } from '../models/Transaction';
const escape=(v:unknown)=>`"${String(v??'').replace(/"/g,'""')}"`;
export async function streamCsv(res:Response,shopDomain:string,type:string){let rows:any[];if(type==='customers')rows=await Customer.find({shopDomain}).lean();else if(type==='transactions')rows=await Transaction.find({shopDomain}).lean();else rows=await RewardRedemption.find({shopDomain}).lean();const keys=rows.length?Object.keys(rows[0]).filter(k=>!['portalPasswordHash','__v'].includes(k)):['_id'];res.setHeader('Content-Type','text/csv; charset=utf-8');res.setHeader('Content-Disposition',`attachment; filename="${type}.csv"`);res.write(keys.map(escape).join(',')+'\n');for(const row of rows)res.write(keys.map(k=>escape(typeof row[k]==='object'?JSON.stringify(row[k]):row[k])).join(',')+'\n');res.end();}
