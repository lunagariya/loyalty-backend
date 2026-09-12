import { RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { Customer } from '../models/Customer';
import { asyncHandler } from '../utils/asyncHandler';
import { AppError } from '../utils/AppError';
export interface CustomerToken {customerId:string;shopDomain:string;tokenType?:string}
export const customerJwtAuth:RequestHandler=asyncHandler(async(req,_res,next)=>{const token=req.headers.authorization?.match(/^Bearer (.+)$/)?.[1];if(!token)throw new AppError('Authentication required',401,'UNAUTHORIZED');let payload:CustomerToken;try{payload=jwt.verify(token,env.jwtSecret) as CustomerToken;}catch{throw new AppError('Invalid or expired token',401,'INVALID_TOKEN');}if(payload.tokenType==='refresh')throw new AppError('Access token required',401,'INVALID_TOKEN');const customer=await Customer.findOne({_id:payload.customerId,shopDomain:payload.shopDomain,isActive:true});if(!customer)throw new AppError('Customer not found',401,'UNAUTHORIZED');req.customer=customer;next();});
