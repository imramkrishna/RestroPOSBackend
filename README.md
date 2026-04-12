# Restaurant POS Backend System

A comprehensive backend system for restaurant Point of Sale (POS) operations, built with Node.js, Express, TypeScript, Prisma, and PostgreSQL.

## Features

- 🔐 **Authentication & Authorization**: JWT-based auth with role-based access control
- 👥 **Staff Management**: Complete CRUD for staff members with different roles
- 🍔 **Menu Management**: Categories and menu items with inventory tracking
- 🧾 **Order System**: Real-time order processing with kitchen display integration
- 🪑 **Table Management**: Live table status tracking
- 📅 **Reservations**: Table booking system with conflict detection
- 📦 **Inventory**: Stock management with low-stock alerts
- 🔄 **Real-time Updates**: Socket.IO for instant order status updates

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: JWT (Access & Refresh tokens)
- **Real-time**: Socket.io
- **Validation**: Zod

## Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (v14 or higher)
- npm or yarn

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd RestroPOSBackend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and configure your database connection and secrets:
   ```
   DATABASE_URL="postgresql://user:password@localhost:5432/restro_pos?schema=public"
   JWT_SECRET="your-super-secret-jwt-key"
   JWT_REFRESH_SECRET="your-super-secret-refresh-key"
   JWT_EXPIRES_IN="15m"
   JWT_REFRESH_EXPIRES_IN="7d"
   PORT=3000
   NODE_ENV="development"
   PRISMA_QUERY_LOGS="false"
   SOCKET_DEBUG_LOGS="false"
   SOCKET_CORS_ORIGINS="http://localhost:3000"
   ```

   Set `PRISMA_QUERY_LOGS="true"` only when you need SQL query debugging.
   Set `SOCKET_DEBUG_LOGS="true"` when you want connection/join/disconnect socket logs.
   Set `SOCKET_CORS_ORIGINS` as comma-separated origins for allowed Socket.IO clients.

4. **Set up the database**
   ```bash
   # Generate Prisma Client
   npm run prisma:generate
   
   # Run migrations
   npm run prisma:migrate
   
   # Seed the database (creates admin user and sample data)
   npx tsx prisma/seed.ts
   ```

## Running the Application

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm run build
npm start
```

### Other Commands
```bash
# Open Prisma Studio (Database GUI)
npm run prisma:studio

# Push schema changes without migration
npm run prisma:push
```

## Default Credentials

After seeding the database, use these credentials to login:

- **Username**: `admin`
- **Password**: `admin123`

## API Documentation

### Base URL
```
http://localhost:3000/api/v1
```

### Authentication Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/auth/login` | Login user | No |
| POST | `/auth/refresh` | Refresh access token | No |
| POST | `/auth/logout` | Logout user | Yes |
| GET | `/auth/me` | Get current user | Yes |

### Staff Management

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/staff` | Get all staff | Admin/Manager |
| POST | `/staff` | Create staff | Admin |
| GET | `/staff/:id` | Get staff by ID | Admin/Manager |
| PATCH | `/staff/:id` | Update staff | Admin |
| DELETE | `/staff/:id` | Delete staff | Admin |

### Menu Management

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/menu` | Get full menu | Public |
| POST | `/menu/categories` | Create category | Admin |
| POST | `/menu/items` | Create menu item | Admin |
| PATCH | `/menu/items/:id` | Update menu item | Admin |
| DELETE | `/menu/items/:id` | Delete menu item | Admin |

### Order System

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/orders` | Get all orders | Authenticated |
| POST | `/orders` | Create order | Authenticated |
| GET | `/orders/:id` | Get order details | Authenticated |
| PATCH | `/orders/:id/status` | Update order status | Chef/Waiter/Manager |
| PATCH | `/orders/:id/items/:itemId/cancel` | Cancel specific order item | Chef/Waiter/Manager |
| POST | `/orders/:id/items` | Add items to order | Authenticated |
| POST | `/orders/:id/pay` | Process payment | Cashier/Manager |

### Table Management

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/tables` | Get all tables | Authenticated |
| GET | `/tables/:id` | Get table details | Authenticated |
| POST | `/tables` | Create table | Authenticated |
| PATCH | `/tables/:id/status` | Update table status | Authenticated |

### Reservations

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/reservations` | Get all reservations | Authenticated |
| POST | `/reservations` | Create reservation | Authenticated |
| GET | `/reservations/:id` | Get reservation | Authenticated |
| PATCH | `/reservations/:id` | Update reservation status | Manager/Waiter |

### Inventory

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/inventory` | Get all inventory | Authenticated |
| POST | `/inventory` | Create inventory item | Manager/Admin |
| GET | `/inventory/alerts` | Get low stock alerts | Authenticated |
| GET | `/inventory/:id` | Get inventory item | Authenticated |
| PATCH | `/inventory/:id` | Update inventory | Manager/Chef |
| DELETE | `/inventory/:id` | Delete inventory item | Manager/Admin |

## User Roles

- **ADMIN**: Full system access
- **MANAGER**: Management and oversight
- **CASHIER**: Payment processing
- **CHEF**: Kitchen operations
- **WAITER**: Order taking and service

## Socket.IO Events

Connect to `http://localhost:3000` with the JWT access token from `/api/v1/auth/login`:

```javascript
const socket = io('http://localhost:3000', {
   auth: { token: accessToken },
});
```

Then join rooms:

### Kitchen Room
```javascript
socket.emit('join:kitchen');
```

Allowed roles: `ADMIN`, `MANAGER`, `CHEF`

### Cashier Room
```javascript
socket.emit('join:cashier');
```

Allowed roles: `ADMIN`, `MANAGER`, `CASHIER`

### Events Emitted
- `order:created` - New order created
- `order:statusUpdate` - Order status changed
- `order:cancelled` - Order cancelled
- `order:itemsAdded` - Items added to order
- `order:itemCancelled` - Specific item removed from order
- `order:completed` - Payment processed
- `socket:error` - Room join denied due to role restrictions

## Frontend Integration Contract

Use this section as the implementation reference for frontend API and Socket.IO integration.

### 1. Response Envelope

Success response:

```json
{
   "success": true,
   "data": {}
}
```

Error response:

```json
{
   "success": false,
   "message": "Error message"
}
```

Validation errors are returned as a JSON-stringified array inside `message`.

Example:

```json
{
   "success": false,
   "message": "[{\"field\":\"body.items.0.quantity\",\"message\":\"Number must be greater than 0\"}]"
}
```

### 2. Authentication API

#### POST `/api/v1/auth/login`

Request:

```json
{
   "username": "admin",
   "password": "admin123"
}
```

Response:

```json
{
   "success": true,
   "data": {
      "accessToken": "jwt-access-token",
      "refreshToken": "jwt-refresh-token",
      "user": {
         "id": "uuid",
         "username": "admin",
         "role": "ADMIN",
         "createdAt": "2026-04-10T00:00:00.000Z",
         "updatedAt": "2026-04-10T00:00:00.000Z",
         "profile": {
            "id": "uuid",
            "userId": "uuid",
            "fullName": "Admin User",
            "phone": "9800000000",
            "avatarUrl": null,
            "status": "ACTIVE",
            "shiftStart": null,
            "shiftEnd": null,
            "createdAt": "2026-04-10T00:00:00.000Z",
            "updatedAt": "2026-04-10T00:00:00.000Z"
         }
      }
   }
}
```

#### POST `/api/v1/auth/refresh`

Request:

```json
{
   "refreshToken": "jwt-refresh-token"
}
```

Response:

```json
{
   "success": true,
   "data": {
      "accessToken": "new-jwt-access-token"
   }
}
```

#### GET `/api/v1/auth/me`

Header:

```text
Authorization: Bearer <accessToken>
```

Response:

```json
{
   "success": true,
   "data": {
      "id": "uuid",
      "username": "admin",
      "role": "ADMIN",
      "createdAt": "2026-04-10T00:00:00.000Z",
      "profile": {
         "id": "uuid",
         "fullName": "Admin User",
         "status": "ACTIVE"
      }
   }
}
```

### 3. Socket.IO Frontend Contract

Connect with JWT access token:

```javascript
const socket = io('http://localhost:3000', {
   auth: { token: accessToken },
   withCredentials: true,
});
```

Possible `connect_error.message` values:

- `Unauthorized: missing access token`
- `Unauthorized: access token expired`
- `Unauthorized: invalid access token`
- `Origin not allowed by Socket.IO CORS`

Client -> server events:

- `join:kitchen` (payload: none)
- `join:cashier` (payload: none)

Server -> client events:

- `order:created`
- `order:statusUpdate`
- `order:cancelled`
- `order:itemsAdded`
- `order:itemCancelled`
- `order:completed`
- `socket:error` with payload:

```json
{
   "message": "Forbidden: kitchen room access denied"
}
```

### 4. Realtime Order Payload Shape

All order events (`order:*`) emit the same payload shape:

```ts
type UserRole = 'ADMIN' | 'MANAGER' | 'CASHIER' | 'CHEF' | 'WAITER';
type TableStatus = 'AVAILABLE' | 'OCCUPIED' | 'RESERVED';
type OrderStatus = 'PENDING' | 'COOKING' | 'SERVED' | 'COMPLETED' | 'CANCELLED';
type PaymentMethod = 'CASH' | 'CARD' | 'UPI' | 'OTHER' | null;
type OrderChannel = 'DINE_IN' | 'TAKEAWAY' | 'ONLINE';
type DeliveryProvider = 'PATHAO_FOOD' | 'FOOD_MANDU' | 'OTHER';
type SettlementStatus = 'PENDING' | 'SETTLED' | 'DISPUTED';

type OrderRealtimePayload = {
   id: string;
   tableId: string | null;
   staffId: string;
   channel: OrderChannel;
   status: OrderStatus;
   subtotal: number;
   tax: number;
   total: number;
   taxRatePercentage: number;
   paymentMethod: PaymentMethod;
   createdAt: string;
   updatedAt: string;
   table: {
      id: string;
      tableNumber: string;
      capacity: number;
      status: TableStatus;
      createdAt: string;
      updatedAt: string;
   } | null;
   staff: {
      id: string;
      username: string;
      role: UserRole;
   };
   orderItems: Array<{
      id: string;
      orderId: string;
      menuItemId: string;
      quantity: number;
      variant: string | null;
      priceAtTime: number;
      notes: string | null;
      createdAt: string;
      menuItem: {
         id: string;
         categoryId: string;
         name: string;
         description: string | null;
         price: number;
         imageUrl: string | null;
         isAvailable: boolean;
         sizes: unknown | null;
         createdAt: string;
         updatedAt: string;
      };
   }>;
   onlineDetails: {
      id: string;
      orderId: string;
      provider: DeliveryProvider;
      externalOrderId: string | null;
      customerName: string;
      customerPhone: string;
      deliveryAddress: string;
      deliveryInstructions: string | null;
      providerGrossAmount: number | null;
      providerCommission: number | null;
      providerDeliveryFee: number | null;
      providerDiscount: number | null;
      expectedPayout: number | null;
      settlementStatus: SettlementStatus;
      settledAt: string | null;
      settlementBatchId: string | null;
      createdAt: string;
      updatedAt: string;
      settlementBatch: {
         id: string;
         provider: DeliveryProvider;
         weekStart: string;
         weekEnd: string;
         orderCount: number;
         grossAmount: number;
         commissionAmount: number;
         netAmount: number;
         notes: string | null;
         settledAt: string;
         createdAt: string;
         updatedAt: string;
      } | null;
   } | null;
};
```

### 5. Order API Payloads

#### POST `/api/v1/orders`

Example DINE_IN request:

```json
{
   "channel": "DINE_IN",
   "tableId": "uuid",
   "items": [
      {
         "menuItemId": "uuid",
         "quantity": 2,
         "variant": "Large",
         "notes": "Less spicy"
      }
   ]
}
```

Example ONLINE request:

```json
{
   "channel": "ONLINE",
   "items": [
      {
         "menuItemId": "uuid",
         "quantity": 1
      }
   ],
   "onlineDetails": {
      "provider": "PATHAO_FOOD",
      "externalOrderId": "PX-1001",
      "customerName": "Ram",
      "customerPhone": "9800000000",
      "deliveryAddress": "Kathmandu",
      "deliveryInstructions": "Leave at gate",
      "providerGrossAmount": 1500,
      "providerCommission": 180,
      "providerDeliveryFee": 120,
      "providerDiscount": 50
   }
}
```

#### PATCH `/api/v1/orders/:id/status`

```json
{
   "status": "COOKING"
}
```

#### PATCH `/api/v1/orders/:id/cancel`

No body.

#### POST `/api/v1/orders/:id/items`

```json
{
   "items": [
      {
         "menuItemId": "uuid",
         "quantity": 1,
         "variant": "Medium",
         "notes": "No onion"
      }
   ]
}
```

#### PATCH `/api/v1/orders/:id/items/:itemId/cancel`

No body.

Path params:

- `id`: order UUID
- `itemId`: order-item UUID (use `orderItems[].id` from the order payload)

Behavior:

- Removes one specific item from the order.
- Allowed only when the parent order status is `PENDING`.
- Item cancellation is blocked when kitchen status is `COOKING` or `SERVED`.
- Recalculates `subtotal`, `tax`, and `total` from remaining items.
- If the cancelled item was the last item, the order is auto-marked `CANCELLED` with zero totals.

Possible errors:

- `404`: order not found
- `404`: order item not found for this order
- `400`: order status is not `PENDING` (`COOKING`, `SERVED`, `COMPLETED`, or `CANCELLED`)

#### POST `/api/v1/orders/:id/pay`

```json
{
   "paymentMethod": "CARD"
}
```

#### GET `/api/v1/orders`

Optional query params:

- `status`: `PENDING | COOKING | SERVED | COMPLETED | CANCELLED`
- `channel`: `DINE_IN | TAKEAWAY | ONLINE`
- `provider`: `PATHAO_FOOD | FOOD_MANDU | OTHER`
- `settlementStatus`: `PENDING | SETTLED | DISPUTED`
- `weekStart`: `YYYY-MM-DD` (must be used with `weekEnd`)
- `weekEnd`: `YYYY-MM-DD` (must be used with `weekStart`)

#### GET `/api/v1/orders/online/summary`

Required query:

- `weekStart`: `YYYY-MM-DD`
- `weekEnd`: `YYYY-MM-DD`

Optional query:

- `provider`: `PATHAO_FOOD | FOOD_MANDU | OTHER`

#### POST `/api/v1/orders/online/settlements`

```json
{
   "provider": "PATHAO_FOOD",
   "weekStart": "2026-04-01",
   "weekEnd": "2026-04-07",
   "notes": "Weekly settlement"
}
```

### 6. Frontend Implementation Flow

1. Login and store `accessToken` + `refreshToken`.
2. Initialize Socket.IO with `auth.token = accessToken`.
3. On socket `connect`, emit `join:kitchen` or `join:cashier` based on role.
4. Subscribe to all `order:*` events and merge payload into local state.
5. On `connect_error` with token-related messages, call `/api/v1/auth/refresh`, reconnect with new access token.
6. On `socket:error`, show authorization message and avoid retrying restricted room joins.

### 7. Frontend Implementation: Cancel Specific Order Item

Use this action in order detail screen or kitchen queue when only one line-item should be removed.

#### Endpoint

`PATCH /api/v1/orders/:id/items/:itemId/cancel`

#### Request

- Method: `PATCH`
- Headers:

```text
Authorization: Bearer <accessToken>
```

- Body: none

Example:

```http
PATCH /api/v1/orders/4f6b0ef3-6f31-41e7-99df-86f87131fb6d/items/0fc79f74-8a08-43cb-b473-c5d4fbe84b1c/cancel
Authorization: Bearer <accessToken>
```

#### Success Response (200)

Returns the full updated order object in standard envelope:

```json
{
   "success": true,
   "data": {
      "id": "4f6b0ef3-6f31-41e7-99df-86f87131fb6d",
      "status": "PENDING",
      "subtotal": 19.03,
      "tax": 0.95,
      "total": 19.98,
      "taxRatePercentage": 5,
      "orderItems": [
         {
            "id": "remaining-order-item-id",
            "menuItemId": "menu-item-id",
            "quantity": 2,
            "priceAtTime": 9.99
         }
      ]
   }
}
```

If the removed item was the last item, response will have:

- `data.status = "CANCELLED"`
- `data.orderItems = []`
- `data.subtotal = 0`, `data.tax = 0`, `data.total = 0`

#### Realtime Events To Handle

- `order:itemCancelled`: emitted when order still has items after removal.
- `order:cancelled`: emitted when last item removal cancels the full order.

#### Frontend Handling Pattern

1. Call cancel-item endpoint with order id and order-item id.
2. Replace local order state with response `data`.
3. Keep socket listeners for both `order:itemCancelled` and `order:cancelled` to stay in sync across tabs/screens.
4. If order becomes `CANCELLED`, remove it from active kitchen/cashier lists.

#### TypeScript Snippet

```ts
type ApiResponse<T> = {
   success: boolean;
   data: T;
   message?: string;
};

async function cancelOrderItem(orderId: string, itemId: string, accessToken: string) {
   const response = await fetch(
      `/api/v1/orders/${orderId}/items/${itemId}/cancel`,
      {
         method: 'PATCH',
         headers: {
            Authorization: `Bearer ${accessToken}`,
         },
      }
   );

   const payload = (await response.json()) as ApiResponse<OrderRealtimePayload>;

   if (!response.ok || !payload.success) {
      throw new Error(payload.message ?? 'Failed to cancel order item');
   }

   return payload.data;
}
```

## Project Structure

```
backend/
├── src/
│   ├── config/          # Configuration files
│   ├── controllers/     # Request handlers
│   ├── middlewares/     # Auth, validation, error handling
│   ├── models/          # Validation schemas
│   ├── routes/          # API routes
│   ├── services/        # Business logic
│   ├── utils/           # Helper functions
│   ├── app.ts           # Express app setup
│   └── server.ts        # Server entry point
├── prisma/
│   ├── schema.prisma    # Database schema
│   └── seed.ts          # Database seeder
└── package.json
```

## Error Handling

All errors return a consistent format:

```json
{
  "success": false,
  "message": "Error message here"
}
```

Status codes:
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `500` - Internal Server Error

## Health Check

```bash
GET /health
```

Response:
```json
{
  "success": true,
  "message": "Server is healthy",
  "timestamp": "2024-03-24T12:00:00.000Z"
}
```

## License

ISC

## Support

For issues and questions, please create an issue in the repository.
