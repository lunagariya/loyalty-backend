import { HydratedDocument } from 'mongoose';
import { logger } from '../config/logger';
import { shopify } from '../config/shopify';
import { IShop, Shop } from '../models/Shop';
import { AppError } from '../utils/AppError';

const REFRESH_EARLY_MS=5*60*1000;
const refreshes=new Map<string,Promise<HydratedDocument<IShop>>>();

const tokenUpdate=(session:{accessToken?:string;refreshToken?:string;expires?:Date;refreshTokenExpires?:Date;scope?:string})=>({
  accessToken:session.accessToken,
  refreshToken:session.refreshToken,
  tokenExpiresAt:session.expires,
  refreshTokenExpiresAt:session.refreshTokenExpires,
  scope:session.scope,
  isActive:true
});

async function refresh(shopDomain:string){
  const current=await Shop.findOne({shopDomain,isActive:true}).select('+accessToken +refreshToken');
  if(!current)throw new AppError('Shop is not installed',403,'SHOP_NOT_INSTALLED');
  if(!current.tokenExpiresAt||current.tokenExpiresAt.getTime()>Date.now()+REFRESH_EARLY_MS)return current;
  if(!current.refreshToken)throw new AppError('Shopify refresh token is unavailable; reopen the embedded app',401,'SHOP_REAUTH_REQUIRED');
  if(current.refreshTokenExpiresAt&&current.refreshTokenExpiresAt.getTime()<=Date.now())throw new AppError('Shopify refresh token expired; reopen the embedded app',401,'SHOP_REAUTH_REQUIRED');
  logger.info('shop_token_refresh_started',{shopDomain});
  const oldRefreshToken=current.refreshToken;
  const {session}=await shopify.auth.refreshToken({shop:shopDomain,refreshToken:oldRefreshToken});
  if(!session.accessToken||!session.refreshToken||!session.expires)throw new Error('Shopify token refresh returned incomplete token metadata');
  const updated=await Shop.findOneAndUpdate({_id:current._id,refreshToken:oldRefreshToken},{$set:tokenUpdate(session)},{new:true}).select('+accessToken +refreshToken');
  if(updated){logger.info('shop_token_refresh_completed',{shopDomain,tokenExpiresAt:updated.tokenExpiresAt});return updated;}
  const winner=await Shop.findOne({_id:current._id,isActive:true}).select('+accessToken +refreshToken');
  if(!winner)throw new AppError('Shop is not installed',403,'SHOP_NOT_INSTALLED');
  return winner;
}

export function ensureFreshShopToken(shop:HydratedDocument<IShop>){
  if(!shop.tokenExpiresAt||shop.tokenExpiresAt.getTime()>Date.now()+REFRESH_EARLY_MS)return Promise.resolve(shop);
  const existing=refreshes.get(shop.shopDomain);if(existing)return existing;
  const pending=refresh(shop.shopDomain).finally(()=>refreshes.delete(shop.shopDomain));
  refreshes.set(shop.shopDomain,pending);return pending;
}

export { tokenUpdate };
