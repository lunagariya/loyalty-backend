# Shopify Loyalty & Rewards Backend

Production-oriented, multi-tenant API for a three-repository system: this Express service, a Shopify-embedded merchant admin, and a standalone customer portal. It stores each shop's offline token, protects merchant APIs with Shopify session tokens, protects portal APIs with JWTs, processes signed webhooks, and maintains an append-only points ledger.

## Architecture

Requests pass through Helmet, allow-listed CORS, rate limiting, validation, authentication, thin controllers, and domain services. MongoDB unique/compound indexes isolate tenants and prevent duplicate webhook processing. Shopify Admin GraphQL is wrapped in one service. Logs are structured JSON and redact credentials. The daily expiration worker performs FIFO allocation before expiring an earn lot.

## Local setup

1. Install an active Node.js LTS release (22+) and MongoDB, then run `npm install`.
2. Copy `.env.example` to `.env` and fill in Shopify Partner app credentials, public HTTPS backend URL, frontend URL, Atlas URI, and a random JWT secret.
3. In the Shopify Partner dashboard, set the app URL and allowed callback URL to `${SHOPIFY_APP_URL}/auth/callback`.
4. Run `npm run dev`. Check `GET /health`.
5. Visit `/auth?shop=store-name.myshopify.com` to install a real shop.

### Protected customer data and webhooks

Customer, order, and refund webhook topics contain protected customer data. Before installing a development app, select a distribution method and enable **Protected customer data access** in the Shopify Dev Dashboard under **Apps → your app → API access requests**. Select protected customer data plus only the fields this app uses: **Name** and **Email**. Development-store testing does not require review after these selections are saved.

After changing protected-data access, reinstall the app from:

`{SHOPIFY_APP_URL}/auth?shop=store-name.myshopify.com`

The OAuth callback reconciles all webhook subscriptions with the current `SHOPIFY_APP_URL`. Reinstall whenever the backend tunnel URL changes so Shopify stops delivering to the expired URL.

Commands: `npm run dev` for development, `npm run build && npm start` for production, `npm test` for tests, and `npm run seed` for demo data. This schema is managed by Mongoose and does not require a separate migration. Treat index/schema changes in production as versioned migration work rather than relying on automatic index creation.

The seed targets `demo-loyalty.myshopify.com` by default and creates 10 customers whose password is printed after completion. To seed an already installed development shop without replacing its OAuth token, run `SEED_SHOP_DOMAIN=store.myshopify.com npm run seed`. It refuses to overwrite existing tenant data unless `SEED_RESET=true` is explicitly supplied. Replace the fake token when using the default demo shop before calling Shopify.

## Render deployment

Create a Node Web Service connected to this repository. Use `npm ci && npm run build` as the build command, `npm start` as the start command, and `/health` as the health check. Set every production variable from `.env.example`, allow Render's outbound addresses in Atlas, and use the Render HTTPS URL for `SHOPIFY_APP_URL`. Run one web instance while the in-process cron is enabled; at scale, move expiration to a singleton worker/queue.

## Assumptions

- Purchase points are awarded on `orders/paid`; `orders/create` is acknowledged but does not award. This prevents rewards on unpaid orders.
- Purchase rules stack. Each rule uses `floor(eligible total / 100) * pointsPerAmount`; Shopify's `current_total_price` is already discount-adjusted.
- Tier is based on lifetime earned points and is not reduced by refunds/redemptions.
- Portal signup remains available if customer lookup temporarily fails, but redemption requires an email-matched Shopify customer because discount codes are customer-scoped.
- Expiration is enabled globally through environment configuration and uses FIFO: deductions consume oldest earn lots first.
- Cancellation/refund reversals never make a balance negative. Refund awards are reversed proportionally from the information present in Shopify's refund payload.

## Known limitations and next steps

Access tokens are excluded from normal queries/logs but should be envelope-encrypted with a KMS in a high-compliance deployment. JWT refresh tokens are stateless; add rotation/revocation for account logout and compromise response. Multi-document point changes use atomic balance updates plus compensating ledger entries because transactions require an Atlas replica set; an outbox/saga and reconciliation worker would further harden external Shopify calls. Failed webhook claims are recorded and reclaimable, but pending claims have no timeout; add a lease for process crashes. Free-product rewards are implemented as a 100% product-scoped code, so cart eligibility remains subject to Shopify discount rules. Add secret rotation, pagination cursors for large exports, queue-backed jobs, metrics/tracing, GDPR webhooks, and broader contract tests before high-volume launch.

See [API_DOCS.md](API_DOCS.md) and [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md).
