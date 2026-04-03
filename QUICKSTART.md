# 🚀 Quick Start Guide

## Prerequisites
- Node.js v18+
- PostgreSQL v14+
- npm or yarn

## Installation & Setup (5 steps)

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
```
Edit `.env` and update the `DATABASE_URL` with your PostgreSQL credentials:
```
DATABASE_URL="postgresql://YOUR_USER:YOUR_PASSWORD@localhost:5432/restro_pos?schema=public"
PRISMA_QUERY_LOGS="false"
SOCKET_DEBUG_LOGS="false"
```

### 3. Generate Prisma Client
```bash
npm run prisma:generate
```

### 4. Run Database Migrations
```bash
npm run prisma:migrate
```
When prompted for a migration name, enter: `init`

### 5. Seed Database
```bash
npm run seed
```
This creates an admin user and sample data.

## 🎉 Start the Server

```bash
npm run dev
```

Server will start at: `http://localhost:3000`

## 🧪 Test the API

### Health Check
```bash
curl http://localhost:3000/health
```

### Login
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

Save the `accessToken` from the response.

### Get Current User
```bash
curl http://localhost:3000/api/v1/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Get Menu (Public Endpoint)
```bash
curl http://localhost:3000/api/v1/menu
```

## 📚 API Documentation

Full API documentation is in [README.md](./README.md)

Base URL: `http://localhost:3000/api/v1`

## 🛠️ Other Useful Commands

### Open Prisma Studio (Database GUI)
```bash
npm run prisma:studio
```

### Build for Production
```bash
npm run build
npm start
```

### View Database Schema
```bash
cat prisma/schema.prisma
```

## 🔐 Default Credentials

- **Username**: `admin`
- **Password**: `admin123`

**⚠️ Change these in production!**

## 📊 Database Overview

The seed creates:
- 1 admin user
- 3 sample categories (Beverages, Main Course, Desserts)
- 2 sample menu items
- 10 tables (T1-T10)

## 🐛 Troubleshooting

### Database Connection Issues
- Verify PostgreSQL is running
- Check DATABASE_URL in .env
- Ensure the database exists: `createdb restro_pos`

### Port Already in Use
- Change PORT in .env to a different number (e.g., 3001)

### Prisma Client Not Generated
```bash
npm run prisma:generate
```

### Migration Issues
```bash
npm run prisma:push  # Alternative to migrate
```

## 📞 Support

Check [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md) for complete feature list.

---

**Happy Coding! 🎉**
