import { HydratedDocument } from 'mongoose';
import { ICustomer } from '../models/Customer';
import { IShop } from '../models/Shop';
declare global { namespace Express { interface Request { shop?: HydratedDocument<IShop>; customer?: HydratedDocument<ICustomer>; rawBody?: Buffer; webhookClaimId?: string; } } }
export {};
