import request from 'supertest';
import app from '../src/app';

describe('Order API Tests', () => {
  let adminToken: string;
  let orderId: string;
  let menuItemId: string;
  let tableId: string;

  beforeAll(async () => {
    const response = await request(app)
      .post('/api/v1/auth/login')
      .send({
        username: 'admin',
        password: 'admin123',
      });
    adminToken = response.body.data.accessToken;

    // Get menu items
    const menuResponse = await request(app).get('/api/v1/menu');
    if (menuResponse.body.data.length > 0 && menuResponse.body.data[0].menuItems.length > 0) {
      menuItemId = menuResponse.body.data[0].menuItems[0].id;
    }

    // Get tables
    const tablesResponse = await request(app)
      .get('/api/v1/tables')
      .set('Authorization', `Bearer ${adminToken}`);
    if (tablesResponse.body.data.length > 0) {
      tableId = tablesResponse.body.data[0].id;
    }
  });

  describe('POST /api/v1/orders', () => {
    it('should create order with authentication', async () => {
      const response = await request(app)
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          tableId,
          items: [
            {
              menuItemId,
              quantity: 2,
              notes: 'Extra spicy',
            },
          ],
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('total');
      expect(response.body.data).toHaveProperty('subtotal');
      expect(response.body.data).toHaveProperty('tax');
      expect(response.body.data.orderItems).toHaveLength(1);
      orderId = response.body.data.id;
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .post('/api/v1/orders')
        .send({
          items: [
            {
              menuItemId,
              quantity: 1,
            },
          ],
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should fail with invalid menu item', async () => {
      const response = await request(app)
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          items: [
            {
              menuItemId: '00000000-0000-0000-0000-000000000000',
              quantity: 1,
            },
          ],
        })
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/orders', () => {
    it('should get all orders', async () => {
      const response = await request(app)
        .get('/api/v1/orders')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should filter orders by status', async () => {
      const response = await request(app)
        .get('/api/v1/orders?status=PENDING')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('GET /api/v1/orders/:id', () => {
    it('should get order by id', async () => {
      const response = await request(app)
        .get(`/api/v1/orders/${orderId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('orderItems');
    });

    it('should fail with non-existent id', async () => {
      const response = await request(app)
        .get('/api/v1/orders/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PATCH /api/v1/orders/:id/status', () => {
    it('should update order status', async () => {
      const response = await request(app)
        .patch(`/api/v1/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'COOKING',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('COOKING');
    });

    it('should fail with invalid status', async () => {
      const response = await request(app)
        .patch(`/api/v1/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'INVALID_STATUS',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/orders/:id/items', () => {
    it('should add items to order', async () => {
      const response = await request(app)
        .post(`/api/v1/orders/${orderId}/items`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          items: [
            {
              menuItemId,
              quantity: 1,
              notes: 'No onions',
            },
          ],
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.orderItems.length).toBeGreaterThan(1);
    });
  });

  describe('POST /api/v1/orders/:id/pay', () => {
    it('should process payment', async () => {
      const response = await request(app)
        .post(`/api/v1/orders/${orderId}/pay`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          paymentMethod: 'CASH',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('COMPLETED');
      expect(response.body.data.paymentMethod).toBe('CASH');
    });

    it('should fail processing already completed order', async () => {
      const response = await request(app)
        .post(`/api/v1/orders/${orderId}/pay`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          paymentMethod: 'CARD',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });
});
