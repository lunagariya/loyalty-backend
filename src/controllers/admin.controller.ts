import { Request, Response } from 'express';
import { Customer } from '../models/Customer';
import { LoyaltyRule } from '../models/LoyaltyRule';
import { Reward } from '../models/Reward';
import { Transaction } from '../models/Transaction';
import { AppError } from '../utils/AppError';
import { ok } from '../utils/apiResponse';
import { overview, topCustomers } from '../services/analyticsService';
import { streamCsv } from '../services/csvExportService';
const shop=(req:Request)=>req.shop!.shopDomain;
export async function dashboard(req:Request,res:Response){const [totalMembers,totals,activeCampaigns]=await Promise.all([Customer.countDocuments({shopDomain:shop(req),isActive:true}),Transaction.aggregate([{$match:{shopDomain:shop(req)}},{$group:{_id:null,issued:{$sum:{$cond:[{$eq:['$type','earn']},'$points',0]}},redeemed:{$sum:{$cond:[{$eq:['$type','redeem']},{$abs:'$points'},0]}}}}]),Promise.all([LoyaltyRule.countDocuments({shopDomain:shop(req),isActive:true}),Reward.countDocuments({shopDomain:shop(req),isActive:true})]).then(x=>x[0]+x[1])]);return ok(res,{totalMembers,totalPointsIssued:totals[0]?.issued||0,totalPointsRedeemed:totals[0]?.redeemed||0,activeCampaigns});}
export async function customers(req:Request,res:Response){const page=Math.max(1,Number(req.query.page)||1),limit=Math.min(100,Math.max(1,Number(req.query.limit)||20));const filter:any={shopDomain:shop(req)};if(req.query.tier)filter.tier=req.query.tier;if(req.query.search)filter.$or=[{email:{$regex:String(req.query.search),$options:'i'}},{name:{$regex:String(req.query.search),$options:'i'}}];const [items,total]=await Promise.all([Customer.find(filter).select('-portalPasswordHash').skip((page-1)*limit).limit(limit).sort({createdAt:-1}),Customer.countDocuments(filter)]);return ok(res,{items,pagination:{page,limit,total,pages:Math.ceil(total/limit)}});}
export async function customerDetail(req:Request,res:Response){const customer=await Customer.findOne({_id:req.params.id,shopDomain:shop(req)}).select('-portalPasswordHash');if(!customer)throw new AppError('Customer not found',404,'NOT_FOUND');const transactions=await Transaction.find({customerId:customer._id,shopDomain:shop(req)}).sort({createdAt:-1});return ok(res,{customer,transactions});}
const models:any={rules:LoyaltyRule,rewards:Reward};
export const listResource=(kind:'rules'|'rewards')=>async(req:Request,res:Response)=>ok(res,await models[kind].find({shopDomain:shop(req)}).sort({createdAt:-1}));
export const createResource=(kind:'rules'|'rewards')=>async(req:Request,res:Response)=>ok(res,await models[kind].create({...req.body,shopDomain:shop(req)}),201);
export const updateResource=(kind:'rules'|'rewards')=>async(req:Request,res:Response)=>{const item=await models[kind].findOneAndUpdate({_id:req.params.id,shopDomain:shop(req)},{$set:req.body},{new:true,runValidators:true});if(!item)throw new AppError('Resource not found',404,'NOT_FOUND');return ok(res,item);};
export const deleteResource=(kind:'rules'|'rewards')=>async(req:Request,res:Response)=>{const item=await models[kind].findOneAndDelete({_id:req.params.id,shopDomain:shop(req)});if(!item)throw new AppError('Resource not found',404,'NOT_FOUND');return ok(res,{deleted:true});};
export const toggleResource=(kind:'rules'|'rewards')=>async(req:Request,res:Response)=>{const old=await models[kind].findOne({_id:req.params.id,shopDomain:shop(req)});if(!old)throw new AppError('Resource not found',404,'NOT_FOUND');old.isActive=!old.isActive;await old.save();return ok(res,old);};
export const analyticsOverview=async(req:Request,res:Response)=>ok(res,await overview(shop(req)));
export const analyticsTop=async(req:Request,res:Response)=>ok(res,await topCustomers(shop(req),Math.min(100,Number(req.query.limit)||10)));
export const analyticsCsv=(req:Request,res:Response)=>streamCsv(res,shop(req),String(req.query.type));
