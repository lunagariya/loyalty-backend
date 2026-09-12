import { Tier } from '../models/Customer';
export const TIER_THRESHOLDS={Bronze:0,Silver:1000,Gold:5000,Platinum:15000} as const;
export function tierForLifetimePoints(points:number):Tier {if(points>=TIER_THRESHOLDS.Platinum)return'Platinum';if(points>=TIER_THRESHOLDS.Gold)return'Gold';if(points>=TIER_THRESHOLDS.Silver)return'Silver';return'Bronze';}
