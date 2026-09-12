import crypto from 'crypto';
import bcrypt from 'bcrypt';
import {connectDatabase,disconnectDatabase} from '../config/db';
import {Shop} from '../models/Shop';
import {LoyaltyRule} from '../models/LoyaltyRule';
import {Reward} from '../models/Reward';
import {Customer} from '../models/Customer';
import {Transaction} from '../models/Transaction';
import {RewardRedemption} from '../models/RewardRedemption';
import {tierForLifetimePoints} from '../services/tierService';

async function seed(){
  await connectDatabase();
  const shopDomain=(process.env.SEED_SHOP_DOMAIN||'demo-loyalty.myshopify.com').toLowerCase();
  const shop=await Shop.findOne({shopDomain}).select('+accessToken');
  if(!shop)await Shop.create({shopDomain,accessToken:'replace-with-development-token',scope:'read_customers,read_orders,write_discounts'});

  const existing=await Promise.all([Customer.countDocuments({shopDomain}),LoyaltyRule.countDocuments({shopDomain}),Reward.countDocuments({shopDomain}),Transaction.countDocuments({shopDomain})]);
  if(existing.some(Boolean)&&process.env.SEED_RESET!=='true')throw new Error(`Seed data already exists for ${shopDomain}. Set SEED_RESET=true to replace tenant demo data.`);
  if(process.env.SEED_RESET==='true')await Promise.all([LoyaltyRule.deleteMany({shopDomain}),Reward.deleteMany({shopDomain}),Customer.deleteMany({shopDomain}),Transaction.deleteMany({shopDomain}),RewardRedemption.deleteMany({shopDomain})]);

  await LoyaltyRule.insertMany([
    {name:'Purchase points',type:'purchase',pointsPerAmount:10,minSpend:100},
    {name:'Signup bonus',type:'signup',flatPoints:100},
    {name:'Birthday bonus',type:'birthday',flatPoints:200},
    {name:'Review bonus',type:'review',flatPoints:50},
    {name:'Referral bonus',type:'referral',flatPoints:300},
  ].map(value=>({...value,shopDomain,isActive:true})));
  await Reward.insertMany([
    {name:'10% off',type:'percentage_discount',value:10,pointsRequired:500},
    {name:'₹250 off',type:'fixed_discount',value:250,pointsRequired:1000},
    {name:'Free shipping',type:'free_shipping',pointsRequired:750},
    {name:'Free sample',type:'free_product',freeProductId:'gid://shopify/Product/1',pointsRequired:1500},
  ].map(value=>({...value,shopDomain,isActive:true})));

  const passwordHash=await bcrypt.hash('Password123!',12);
  for(let index=1;index<=10;index++){
    const currentPoints=index*400,lifetimePoints=currentPoints+Math.floor(index/3)*250;
    const customer=await Customer.create({shopDomain,email:`customer${index}@example.com`,name:`Demo Customer ${index}`,portalPasswordHash:passwordHash,currentPoints,lifetimePoints,redeemedPoints:lifetimePoints-currentPoints,tier:tierForLifetimePoints(lifetimePoints),tierUpdatedAt:new Date(),referralCode:crypto.randomBytes(6).toString('hex').toUpperCase(),totalSpend:lifetimePoints*10});
    await Transaction.create({shopDomain,customerId:customer._id,type:'earn',points:lifetimePoints,source:'manual',referenceId:`seed-${index}`,balanceAfter:lifetimePoints,expiresAt:new Date(Date.now()+365*86400000)});
    if(lifetimePoints>currentPoints)await Transaction.create({shopDomain,customerId:customer._id,type:'redeem',points:currentPoints-lifetimePoints,source:'redemption',referenceId:`seed-redemption-${index}`,balanceAfter:currentPoints});
  }
  console.log(`Seed complete for ${shopDomain}. Demo password: Password123!`);
  await disconnectDatabase();
}

seed().catch(async error=>{console.error(error);await disconnectDatabase();process.exit(1)});
