# API documentation

All JSON responses use `{ "success": true, "data": ... }` or `{ "success": false, "error": { "message": "...", "code": "..." } }`. Validation errors may also include `details`. Admin routes require `Authorization: Bearer <Shopify session token>`; customer routes outside `/auth` require `Authorization: Bearer <portal access JWT>`. Webhooks require Shopify's HMAC and identifying headers.

## OAuth and customer authentication

| Method | Path | Auth | Request | Success |
|---|---|---|---|---|
| GET | `/auth?shop=acme.myshopify.com` | None | Query `shop` | `302` Shopify consent |
| GET | `/auth/callback` | Shopify OAuth query | Shopify callback values | `302` admin app |
| POST | `/api/customer/auth/register` | None | `{"email":"a@b.com","password":"Password123!","name":"A","shopDomain":"acme.myshopify.com"}` | `201`, customer ID/email |
| POST | `/api/customer/auth/login` | None | `{"email":"a@b.com","password":"Password123!","shopDomain":"acme.myshopify.com"}` | `200`, access/refresh tokens |
| POST | `/api/customer/auth/refresh` | None | `{"refreshToken":"..."}` | `200`, new access token |

Registration returns `409` for an existing tenant/email. Authentication failures return `401`; unknown shops return `404`; malformed input returns `422`.

## Admin API

| Method | Path | Request/query | Returned data |
|---|---|---|---|
| GET | `/api/admin/dashboard/summary` | — | `totalMembers`, `totalPointsIssued`, `totalPointsRedeemed`, `activeCampaigns` |
| GET | `/api/admin/customers` | `search`, `tier`, `page`, `limit` | `items` and pagination |
| GET | `/api/admin/customers/:id` | MongoDB customer ID | customer and complete transaction history |
| GET | `/api/admin/rules` | — | rules |
| POST | `/api/admin/rules` | Rule body below | created rule (`201`) |
| PUT | `/api/admin/rules/:id` | Full rule body | updated rule |
| DELETE | `/api/admin/rules/:id` | — | `{"deleted":true}` |
| PATCH | `/api/admin/rules/:id/toggle` | — | rule with inverted `isActive` |
| GET | `/api/admin/rewards` | — | rewards |
| POST | `/api/admin/rewards` | Reward body below | created reward (`201`) |
| PUT | `/api/admin/rewards/:id` | Full reward body | updated reward |
| DELETE | `/api/admin/rewards/:id` | — | `{"deleted":true}` |
| PATCH | `/api/admin/rewards/:id/toggle` | — | reward with inverted `isActive` |
| GET | `/api/admin/analytics/overview` | — | revenue, issued/redeemed points, rate, active members, six-month growth |
| GET | `/api/admin/analytics/top-customers` | `limit` (default 10) | customers ordered by lifetime points |
| GET | `/api/admin/analytics/export/csv` | `type=customers\|transactions\|redemptions` | streamed CSV attachment |

Rule example: `{"name":"Purchases","type":"purchase","pointsPerAmount":10,"minSpend":100,"isActive":true}`. Flat rules use `flatPoints`. Reward example: `{"name":"10% off","type":"percentage_discount","value":10,"pointsRequired":500,"usageLimitPerCustomer":1,"isActive":true}`. A `free_product` also supplies `freeProductId`; shipping ignores `value`.

Admin endpoints return `401` for missing/invalid tokens, `403` for an uninstalled shop, `404` for an unknown tenant-owned ID, `409` for uniqueness conflicts, `422` for invalid input, and `500` for unexpected failures.

## Customer API

| Method | Path | Request/query | Returned data |
|---|---|---|---|
| GET | `/api/customer/me` | — | identity, balances, tier, birthday |
| GET | `/api/customer/transactions` | `page`, `limit` | ledger items and pagination |
| GET | `/api/customer/rewards/available` | — | active affordable rewards |
| POST | `/api/customer/redeem/:rewardId` | No body | redemption and single-use discount (`201`) |

Example redemption data: `{"status":"success","pointsDeducted":500,"discountCode":"LOYALTY-AB12CD34","shopifyDiscountId":"gid://shopify/DiscountCodeNode/..."}`. Redemption may return `409 INSUFFICIENT_POINTS`/`USAGE_LIMIT`, `422 SHOPIFY_CUSTOMER_REQUIRED`, or `502 SHOPIFY_ERROR`; failed Shopify creation compensates the deducted balance.

## Shopify webhooks

All are `POST`: `/webhooks/orders/create`, `/webhooks/orders/paid`, `/webhooks/orders/updated`, `/webhooks/orders/cancelled`, `/webhooks/orders/refunded`, `/webhooks/customers/create`, and `/webhooks/app/uninstalled`. Send raw JSON with `X-Shopify-Hmac-Sha256`, `X-Shopify-Webhook-Id`, `X-Shopify-Shop-Domain`, and `X-Shopify-Topic`. Success is `200` with `processed:true`; a retry of a claimed ID is `200` with `duplicate:true`. Bad HMAC is `401`, missing headers/invalid JSON is `400`, and processing failure is `500` so Shopify can retry. Paid orders without a Shopify customer ID or email are acknowledged with `outcome: skipped` because points cannot safely be assigned; attaching a customer later triggers `orders/updated` and retries the award.

`GET /health` is unauthenticated and returns `{"success":true,"data":{"status":"ok"}}`. All `/api` endpoints may return `429 RATE_LIMITED`.
