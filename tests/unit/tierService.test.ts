import { tierForLifetimePoints } from '../../src/services/tierService';
describe('tierForLifetimePoints',()=>{it.each([[0,'Bronze'],[999,'Bronze'],[1000,'Silver'],[4999,'Silver'],[5000,'Gold'],[14999,'Gold'],[15000,'Platinum']])('maps %i to %s',(points,tier)=>expect(tierForLifetimePoints(points as number)).toBe(tier));});
