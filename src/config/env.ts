import 'dotenv/config';

const requiredInProduction = ['MONGODB_URI','SHOPIFY_API_KEY','SHOPIFY_API_SECRET','SHOPIFY_APP_URL','ADMIN_APP_URL','JWT_SECRET'] as const;
if (process.env.NODE_ENV === 'production') for (const key of requiredInProduction) if (!process.env[key]) throw new Error(`Missing required environment variable: ${key}`);

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development', port: Number(process.env.PORT || 3000),
  mongoUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/loyalty',
  shopifyApiKey: process.env.SHOPIFY_API_KEY || 'test-key', shopifyApiSecret: process.env.SHOPIFY_API_SECRET || 'test-secret',
  shopifyScopes: (process.env.SHOPIFY_SCOPES || 'read_customers,read_orders,write_discounts').split(',').map(s => s.trim()),
  shopifyAppUrl: process.env.SHOPIFY_APP_URL || 'http://localhost:3000', adminAppUrl: process.env.ADMIN_APP_URL || 'http://localhost:3001',
  shopifyApiVersion: process.env.SHOPIFY_API_VERSION || '2026-07',
  jwtSecret: process.env.JWT_SECRET || 'development-secret-change-me-32-chars', jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1h',
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d', corsOrigins: (process.env.CORS_ORIGINS || 'http://localhost:3001,http://localhost:3002').split(','),
  rateWindowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 900000), rateMax: Number(process.env.RATE_LIMIT_MAX || 100),
  expirationEnabled: process.env.POINTS_EXPIRATION_ENABLED !== 'false', expirationMonths: Number(process.env.POINTS_EXPIRATION_MONTHS || 12),
  cronSchedule: process.env.CRON_SCHEDULE || '0 2 * * *', logLevel: process.env.LOG_LEVEL || 'info'
};
