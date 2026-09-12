import rateLimit from 'express-rate-limit';
import { env } from '../config/env';
export const apiRateLimiter=rateLimit({windowMs:env.rateWindowMs,limit:env.rateMax,standardHeaders:'draft-7',legacyHeaders:false,message:{success:false,error:{message:'Too many requests','code':'RATE_LIMITED'}}});
