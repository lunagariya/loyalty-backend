import { calculatePurchasePoints } from '../../src/services/pointsService';
describe('calculatePurchasePoints',()=>{it('awards only complete ₹100 blocks',()=>{expect(calculatePurchasePoints(299.99,10)).toBe(20);});it('honours minimum spend',()=>{expect(calculatePurchasePoints(99,10,100)).toBe(0);});});
