import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { authCallback, beginAuth } from '../controllers/oauth.controller';
export const authRouter=Router();authRouter.get('/',asyncHandler(beginAuth));authRouter.get('/callback',asyncHandler(authCallback));
