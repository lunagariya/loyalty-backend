import cron from 'node-cron';
import { env } from '../config/env';
import { logger } from '../config/logger';
import { expirePoints } from '../services/pointsExpirationService';
export function startPointsExpirationJob(){if(!env.expirationEnabled)return;cron.schedule(env.cronSchedule,()=>expirePoints().then(()=>logger.info('points_expiration_complete')).catch(error=>logger.error('points_expiration_failed',{message:error.message,stack:error.stack})),{timezone:'Asia/Kolkata'});}
