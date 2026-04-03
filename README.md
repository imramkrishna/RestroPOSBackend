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
   ```

   Set `PRISMA_QUERY_LOGS="true"` only when you need SQL query debugging.
   Set `SOCKET_DEBUG_LOGS="true"` when you want connection/join/disconnect socket logs.

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

Connect to `http://localhost:3000` and join rooms:

### Kitchen Room
```javascript
socket.emit('join:kitchen');
```

### Cashier Room
```javascript
socket.emit('join:cashier');
```

### Events Emitted
- `order:created` - New order created
- `order:statusUpdate` - Order status changed
- `order:itemsAdded` - Items added to order
- `order:completed` - Payment processed

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
