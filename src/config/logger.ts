import winston from 'winston';
import { env } from './env';
const sensitiveKey=/(?:password|portalPasswordHash|accessToken|authorization|token)/i;
function redactValue(value:unknown,seen=new WeakSet<object>()):void{
  if(!value||typeof value!=='object'||seen.has(value as object))return;
  seen.add(value as object);
  for(const[key,nested]of Object.entries(value as Record<string,unknown>)){
    if(sensitiveKey.test(key))(value as Record<string,unknown>)[key]='[REDACTED]';
    else redactValue(nested,seen);
  }
}
// Mutate the Winston info object so its Symbol(level) metadata is preserved.
const redact=winston.format((info)=>{redactValue(info);return info;});
export const logger = winston.createLogger({ level: env.logLevel, format: winston.format.combine(redact(), winston.format.timestamp(), winston.format.json()), transports: [new winston.transports.Console()] });
