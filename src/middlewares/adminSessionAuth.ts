import { RequestHandler } from 'express';
import { shopify } from '../config/shopify';
import { Shop } from '../models/Shop';
import { asyncHandler } from '../utils/asyncHandler';
import { AppError } from '../utils/AppError';
export const adminSessionAuth:RequestHandler=asyncHandler(async(req,_res,next)=>{const token=req.headers.authorization?.match(/^Bearer (.+)$/)?.[1];if(!token)throw new AppError('Shopify session token required',401,'UNAUTHORIZED');let payload;try{payload=await shopify.session.decodeSessionToken(token);}catch{throw new AppError('Invalid Shopify session token',401,'INVALID_TOKEN');}const destination=new URL(payload.dest);const shop=await Shop.findOne({shopDomain:destination.hostname,isActive:true}).select('+accessToken');if(!shop)throw new AppError('Shop is not installed',403,'SHOP_NOT_INSTALLED');req.shop=shop;next();});
