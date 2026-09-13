import { Request, Response } from 'express';
import { shopify } from '../config/shopify';
import { env } from '../config/env';
import { Shop } from '../models/Shop';
import { registerWebhooks } from '../services/shopifyGraphqlService';
import { tokenUpdate } from '../services/shopTokenService';
import { AppError } from '../utils/AppError';
export async function beginAuth(req:Request,res:Response){const shop=String(req.query.shop||'').toLowerCase();if(!/^[a-z0-9][a-z0-9-]*\.myshopify\.com$/.test(shop))throw new AppError('Invalid shop domain',400,'INVALID_SHOP');await shopify.auth.begin({shop,callbackPath:'/auth/callback',isOnline:false,rawRequest:req,rawResponse:res});}
export async function authCallback(req:Request,res:Response){const callback=await shopify.auth.callback({rawRequest:req,rawResponse:res,expiring:true});const session=callback.session;const stored=await Shop.findOneAndUpdate({shopDomain:session.shop},{$set:{...tokenUpdate(session),installedAt:new Date()},$unset:{uninstalledAt:1}},{upsert:true,new:true}).select('+accessToken +refreshToken');await registerWebhooks(stored,env.shopifyAppUrl.replace(/\/$/,''));res.redirect(`${env.adminAppUrl}?shop=${encodeURIComponent(session.shop)}`);}
