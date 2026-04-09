import request from 'supertest';
import app from '../src/app.js';

describe('Order API Tests', () => {
  let adminToken: string;
  let managerToken: string;
  let orderId: string;
  let cancellableOrderId: string;
  let menuItemId: string;

  beforeAll(async () => {
    const response = await request(app)
      .post('/api/v1/auth/login')
      .send({
        username: 'admin',
        password: 'admin123',
      });
    adminToken = response.body.data.accessToken;

    const managerUsername = `order_mgr_${Date.now()}`;
    await request(app)
      .post('/api/v1/staff')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        username: managerUsername,
        password: 'test123456',
        role: 'MANAGER',
        fullName: 'Order Test Manager',
      })
      .expect(201);

    const managerLoginResponse = await request(app)
      .post('/api/v1/auth/login')
      .send({
        username: managerUsername,
        password: 'test123456',
      })
      .expect(200);
    managerToken = managerLoginResponse.body.data.accessToken;

    // Get menu items - but seeded items have invalid UUIDs (not RFC 4122 compliant)
    // So we always create a new menu item with a proper UUID
    const menuResponse = await request(app).get('/api/v1/menu');
    const categories = menuResponse.body.data || [];

    // Find an existing category or create one
    let categoryId: string;
    if (categories.length > 0) {
      categoryId = categories[0].id;
    } else {
      const categoryResponse = await request(app)
        .post('/api/v1/menu/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: `Order Test Category ${Date.now()}`,
        });

      if (categoryResponse.status !== 201) {
        throw new Error(`Failed to create category: ${JSON.stringify(categoryResponse.body)}`);
      }
      categoryId = categoryResponse.body.data.id;
    }

    // Always create a new menu item to get a proper UUID
    const itemResponse = await request(app)
      .post('/api/v1/menu/items')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        categoryId,
        name: `Order Test Item ${Date.now()}`,
        price: 9.99,
        isAvailable: true,
      });

    if (itemResponse.status !== 201) {
      throw new Error(`Failed to create menu item: ${JSON.stringify(itemResponse.body)}`);
    }

    menuItemId = itemResponse.body.data.id;

    if (!menuItemId) {
      throw new Error('Failed to get or create a menu item for testing');
    }
  });

  describe('POST /api/v1/orders', () => {
    it('should create order with authentication', async () => {
      const response = await request(app)
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
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
      expect(response.body.data).toHaveProperty('taxRatePercentage');
      expect(response.body.data.taxRatePercentage).toBe(5);
      expect(response.body.data.total).toBeCloseTo(19.98, 2);
      expect(response.body.data.subtotal).toBeCloseTo(19.03, 2);
      expect(response.body.data.tax).toBeCloseTo(0.95, 2);
      expect(response.body.data.subtotal + response.body.data.tax).toBeCloseTo(response.body.data.total, 2);
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
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should filter orders by status', async () => {
      const response = await request(app)
        .get('/api/v1/orders?status=PENDING')
        .set('Authorization', `Bearer ${managerToken}`)
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
        .set('Authorization', `Bearer ${managerToken}`)
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
        .set('Authorization', `Bearer ${managerToken}`)
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
      expect(response.body.data.taxRatePercentage).toBe(5);
      expect(response.body.data.total).toBeCloseTo(29.97, 2);
      expect(response.body.data.subtotal).toBeCloseTo(28.54, 2);
      expect(response.body.data.tax).toBeCloseTo(1.43, 2);
      expect(response.body.data.subtotal + response.body.data.tax).toBeCloseTo(response.body.data.total, 2);
    });
  });

  describe('PATCH /api/v1/orders/:id/cancel', () => {
    it('should cancel an active order', async () => {
      const createResponse = await request(app)
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          items: [
            {
              menuItemId,
              quantity: 1,
            },
          ],
        })
        .expect(201);

      cancellableOrderId = createResponse.body.data.id;

      const response = await request(app)
        .patch(`/api/v1/orders/${cancellableOrderId}/cancel`)
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('CANCELLED');
      expect(response.body.data.taxRatePercentage).toBe(5);
    });

    it('should fail cancelling an already cancelled order', async () => {
      const response = await request(app)
        .patch(`/api/v1/orders/${cancellableOrderId}/cancel`)
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should fail processing payment for a cancelled order', async () => {
      const response = await request(app)
        .post(`/api/v1/orders/${cancellableOrderId}/pay`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          paymentMethod: 'CARD',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/orders/:id/pay', () => {
    it('should process payment', async () => {
      const response = await request(app)
        .post(`/api/v1/orders/${orderId}/pay`)
        .set('Authorization', `Bearer ${managerToken}`)
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
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          paymentMethod: 'CARD',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });
});
