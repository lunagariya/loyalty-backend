import '@shopify/shopify-api/adapters/node';
import { ApiVersion, shopifyApi } from '@shopify/shopify-api';
import { env } from './env';
export const shopify = shopifyApi({ apiKey: env.shopifyApiKey, apiSecretKey: env.shopifyApiSecret, scopes: env.shopifyScopes, hostName: env.shopifyAppUrl.replace(/^https?:\/\//, ''), apiVersion: env.shopifyApiVersion as ApiVersion, isEmbeddedApp: true });
