import { Request, Response } from 'express';
import { Reward } from '../models/Reward';
import { Transaction } from '../models/Transaction';
import { ok } from '../utils/apiResponse';
import { redeemReward } from '../services/redemptionService';
export async function me(req:Request,res:Response){const c=req.customer!;return ok(res,{email:c.email,name:c.name,currentPoints:c.currentPoints,lifetimePoints:c.lifetimePoints,redeemedPoints:c.redeemedPoints,tier:c.tier,birthday:c.birthday});}
export async function transactions(req:Request,res:Response){const page=Math.max(1,Number(req.query.page)||1),limit=Math.min(100,Math.max(1,Number(req.query.limit)||20)),filter={shopDomain:req.customer!.shopDomain,customerId:req.customer!._id};const [items,total]=await Promise.all([Transaction.find(filter).sort({createdAt:-1}).skip((page-1)*limit).limit(limit),Transaction.countDocuments(filter)]);return ok(res,{items,pagination:{page,limit,total,pages:Math.ceil(total/limit)}});}
export async function rewards(req:Request,res:Response){return ok(res,await Reward.find({shopDomain:req.customer!.shopDomain,isActive:true,pointsRequired:{$lte:req.customer!.currentPoints}}).sort({pointsRequired:1}));}
export async function redeem(req:Request,res:Response){return ok(res,await redeemReward(req.customer!.shopDomain,String(req.customer!._id),String(req.params.rewardId)),201);}
