import { RequestHandler } from 'express';
import { logger } from '../config/logger';
export const requestLogger:RequestHandler=(req,res,next)=>{const start=Date.now();res.on('finish',()=>logger.info('api_request',{method:req.method,path:req.path,status:res.statusCode,durationMs:Date.now()-start}));next();};
