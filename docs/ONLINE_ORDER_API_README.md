# Online Orders + Weekly Settlement API Guide

This document describes the hybrid implementation added to this backend:
- Single `orders` table for all order types.
- `online_order_details` table for delivery-provider specific fields.
- `settlement_batches` table for weekly provider payouts.

## 1. What Was Implemented

### Database design

The Prisma schema now supports:
- `Order.channel` enum: `DINE_IN`, `TAKEAWAY`, `ONLINE`
- `OnlineOrderDetails` (1:1 with `Order`) for provider metadata and settlement tracking
- `SettlementBatch` for weekly payout batches

### Backend behavior

- Existing order lifecycle endpoints continue to work.
- New filtering support in `GET /api/v1/orders`:
  - `status`, `channel`, `provider`, `settlementStatus`, `weekStart`, `weekEnd`
- New settlement endpoints:
  - `GET /api/v1/orders/online/summary`
  - `POST /api/v1/orders/online/settlements`

## 2. Migration / Setup Steps

After pulling these changes:

```bash
npm run prisma:generate
npm run prisma:migrate -- --name add-online-order-settlement
```

If you do not want migrations in local dev, use:

```bash
npm run prisma:push
```

## 3. Enums You Must Use

### Order channel
- `DINE_IN`
- `TAKEAWAY`
- `ONLINE`

### Delivery provider
- `PATHAO_FOOD`
- `FOOD_MANDU`
- `OTHER`

### Settlement status
- `PENDING`
- `SETTLED`
- `DISPUTED`

## 4. API Endpoints

All endpoints are under `/api/v1/orders` and require `Authorization: Bearer <token>`.

### 4.1 Create order

`POST /api/v1/orders`

#### Rules
- `DINE_IN`: `tableId` is required, `onlineDetails` is not allowed.
- `TAKEAWAY`: `tableId` is not allowed, `onlineDetails` is not allowed.
- `ONLINE`: `tableId` is not allowed, `onlineDetails` is required.
- If `channel` is omitted:
  - with `tableId` -> treated as `DINE_IN`
  - without `tableId` -> treated as `TAKEAWAY`

#### Dine-in payload

```json
{
  "channel": "DINE_IN",
  "tableId": "7c1d14d0-2c3d-4e12-a2c9-f0e88cbf6db0",
  "items": [
    {
      "menuItemId": "e7169dd8-8ec8-41a3-b242-cf7f1456c2ea",
      "quantity": 2,
      "variant": "Large",
      "notes": "Less spicy"
    }
  ]
}
```

#### Takeaway payload

```json
{
  "channel": "TAKEAWAY",
  "items": [
    {
      "menuItemId": "e7169dd8-8ec8-41a3-b242-cf7f1456c2ea",
      "quantity": 1
    }
  ]
}
```

#### Online payload

```json
{
  "channel": "ONLINE",
  "onlineDetails": {
    "provider": "PATHAO_FOOD",
    "externalOrderId": "PF-2026-00031",
    "customerName": "Ram Yadav",
    "customerPhone": "9800000000",
    "deliveryAddress": "Lalitpur, Jawalakhel",
    "deliveryInstructions": "Call before arrival",
    "providerGrossAmount": 1350,
    "providerCommission": 180,
    "providerDeliveryFee": 90,
    "providerDiscount": 50
  },
  "items": [
    {
      "menuItemId": "e7169dd8-8ec8-41a3-b242-cf7f1456c2ea",
      "quantity": 2,
      "notes": "No onion"
    }
  ]
}
```

### 4.2 List orders with filters

`GET /api/v1/orders`

#### Supported query params
- `status`: `PENDING | COOKING | SERVED | COMPLETED | CANCELLED`
- `channel`: `DINE_IN | TAKEAWAY | ONLINE`
- `provider`: `PATHAO_FOOD | FOOD_MANDU | OTHER`
- `settlementStatus`: `PENDING | SETTLED | DISPUTED`
- `weekStart`: `YYYY-MM-DD`
- `weekEnd`: `YYYY-MM-DD`

`weekStart` and `weekEnd` must be sent together.

#### Example

```http
GET /api/v1/orders?channel=ONLINE&provider=PATHAO_FOOD&settlementStatus=PENDING&weekStart=2026-04-01&weekEnd=2026-04-07
```

### 4.3 Online settlement summary (pending only)

`GET /api/v1/orders/online/summary?weekStart=YYYY-MM-DD&weekEnd=YYYY-MM-DD&provider=PATHAO_FOOD`

`provider` is optional. If omitted, summary is grouped for all providers.

#### Example response

```json
{
  "success": true,
  "data": {
    "weekStart": "2026-04-01",
    "weekEnd": "2026-04-07",
    "providers": [
      {
        "provider": "PATHAO_FOOD",
        "orderCount": 43,
        "grossAmount": 56800,
        "commissionAmount": 6400,
        "discountAmount": 1200,
        "netAmount": 49200
      }
    ],
    "totals": {
      "orderCount": 43,
      "grossAmount": 56800,
      "commissionAmount": 6400,
      "discountAmount": 1200,
      "netAmount": 49200
    }
  }
}
```

### 4.4 Create weekly settlement batch

`POST /api/v1/orders/online/settlements`

#### Payload

```json
{
  "provider": "PATHAO_FOOD",
  "weekStart": "2026-04-01",
  "weekEnd": "2026-04-07",
  "notes": "Paid via bank transfer on Friday"
}
```

#### What it does
- Finds pending online orders for provider within week range.
- Creates one `settlement_batches` record.
- Marks matching `online_order_details` rows as `SETTLED`.
- Links those rows to the created batch.

If no pending records are found, API returns `400`.

### 4.5 Existing endpoints (unchanged path)

- `GET /api/v1/orders/:id`
- `PATCH /api/v1/orders/:id/status`
- `POST /api/v1/orders/:id/items`
- `POST /api/v1/orders/:id/pay`

## 5. Frontend Changes Required

## 5.1 New create-order form behavior

Add order type selector:
- `DINE_IN`
- `TAKEAWAY`
- `ONLINE`

Conditional UI:
- If `DINE_IN`: show required `tableId` selector.
- If `TAKEAWAY`: hide `tableId` and `onlineDetails`.
- If `ONLINE`: show `onlineDetails` section and hide `tableId`.

## 5.2 New onlineDetails fields for ONLINE channel

In frontend form/state for ONLINE orders, collect:
- `provider` (required)
- `externalOrderId` (optional)
- `customerName` (required)
- `customerPhone` (required)
- `deliveryAddress` (required)
- `deliveryInstructions` (optional)
- `providerGrossAmount` (optional)
- `providerCommission` (optional)
- `providerDeliveryFee` (optional)
- `providerDiscount` (optional)

## 5.3 Orders list filters

Add filters in orders page:
- `channel`
- `provider`
- `settlementStatus`
- week range (`weekStart`, `weekEnd`)

Example frontend request:

```ts
GET /api/v1/orders?channel=ONLINE&provider=FOOD_MANDU&weekStart=2026-04-01&weekEnd=2026-04-07
```

## 5.4 Weekly settlement page

Create a "Provider Settlements" page:
1. Select week range and optional provider.
2. Call `GET /api/v1/orders/online/summary` to preview payable totals.
3. Trigger settlement using `POST /api/v1/orders/online/settlements`.
4. Refresh online order list with `settlementStatus=SETTLED` after success.

## 5.5 Suggested frontend TypeScript types

```ts
export type OrderChannel = 'DINE_IN' | 'TAKEAWAY' | 'ONLINE';
export type DeliveryProvider = 'PATHAO_FOOD' | 'FOOD_MANDU' | 'OTHER';
export type SettlementStatus = 'PENDING' | 'SETTLED' | 'DISPUTED';

export interface OnlineDetailsInput {
  provider: DeliveryProvider;
  externalOrderId?: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  deliveryInstructions?: string;
  providerGrossAmount?: number;
  providerCommission?: number;
  providerDeliveryFee?: number;
  providerDiscount?: number;
}

export interface OrderBilling {
  subtotal: number; // extracted pre-tax amount
  tax: number; // extracted tax amount
  total: number; // tax-inclusive amount (sum of menu prices)
  taxRatePercentage: number; // currently 5
}
```

## 5.6 Billing behavior change (tax-inclusive pricing)

Menu prices are now treated as tax-inclusive. Backend no longer adds tax on top of menu totals.

Frontend must follow these rules:
- Do not calculate and add extra tax in frontend.
- Use `data.total` from API as the final payable amount.
- Display `data.subtotal` as pre-tax amount and `data.tax` as extracted tax amount.
- Display `data.taxRatePercentage` as the tax rate label in invoice/bill UI.

Current extraction logic in backend:
- `subtotal = total / 1.05`
- `tax = total - subtotal`

Affected endpoints returning updated billing fields:
- `POST /api/v1/orders`
- `GET /api/v1/orders`
- `GET /api/v1/orders/:id`
- `PATCH /api/v1/orders/:id/status`
- `POST /api/v1/orders/:id/items`
- `POST /api/v1/orders/:id/pay`

## 6. Role Access

- `GET /api/v1/orders`: `admin`, `chef`, `manager`, `waiter`, `cashier`
- `GET /api/v1/orders/online/summary`: `admin`, `manager`, `cashier`
- `POST /api/v1/orders/online/settlements`: `admin`, `manager`, `cashier`

## 7. Important Notes

- Settlement summary currently includes only `PENDING` online rows.
- Settlement batch creation is provider-specific and week-specific.
- Duplicate settlement batch for same provider + week range is blocked.
- If you send invalid date format, use `YYYY-MM-DD`.
