import { ErrorRequestHandler } from 'express';
import { MongoServerError } from 'mongodb';
import { logger } from '../config/logger';
import { AppError } from '../utils/AppError';
export const errorHandler:ErrorRequestHandler=(err,req,res,_next)=>{ logger.error('request_error',{method:req.method,path:req.path,message:err.message,stack:err.stack}); let status=err instanceof AppError?err.statusCode:500; let code=err instanceof AppError?err.code:'INTERNAL_ERROR'; let message=status===500?'Internal server error':err.message; if(err instanceof MongoServerError&&err.code===11000){status=409;code='DUPLICATE_RESOURCE';message='Resource already exists';} res.status(status).json({success:false,error:{message,code}}); };
