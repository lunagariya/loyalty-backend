import { RequestHandler } from 'express';
import { validationResult } from 'express-validator';
export const validate:RequestHandler=(req,res,next)=>{const result=validationResult(req);if(!result.isEmpty())return res.status(422).json({success:false,error:{message:'Validation failed',code:'VALIDATION_ERROR',details:result.array()}});next();};
