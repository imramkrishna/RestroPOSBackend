import request from 'supertest';
import app from '../src/app';

describe('Inventory API Tests', () => {
  let adminToken: string;
  let inventoryItemId: string;

  beforeAll(async () => {
    const response = await request(app)
      .post('/api/v1/auth/login')
      .send({
        username: 'admin',
        password: 'admin123',
      });
    adminToken = response.body.data.accessToken;
  });

  describe('POST /api/v1/inventory', () => {
    it('should create inventory item as admin', async () => {
      const response = await request(app)
        .post('/api/v1/inventory')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          itemName: 'Tomatoes',
          category: 'Vegetables',
          quantity: 50,
          unit: 'kg',
          minStockLevel: 10,
          costPrice: 2.5,
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.itemName).toBe('Tomatoes');
      expect(response.body.data.quantity).toBe(50);
      inventoryItemId = response.body.data.id;
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .post('/api/v1/inventory')
        .send({
          itemName: 'Onions',
          category: 'Vegetables',
          quantity: 30,
          unit: 'kg',
          minStockLevel: 5,
          costPrice: 1.5,
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/inventory', () => {
    it('should get all inventory items', async () => {
      const response = await request(app)
        .get('/api/v1/inventory')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .get('/api/v1/inventory')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/inventory/:id', () => {
    it('should get inventory item by id', async () => {
      const response = await request(app)
        .get(`/api/v1/inventory/${inventoryItemId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('itemName');
    });

    it('should fail with non-existent id', async () => {
      const response = await request(app)
        .get('/api/v1/inventory/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PATCH /api/v1/inventory/:id', () => {
    it('should update inventory quantity', async () => {
      const response = await request(app)
        .patch(`/api/v1/inventory/${inventoryItemId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          quantity: 75,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.quantity).toBe(75);
    });

    it('should fail with non-existent id', async () => {
      const response = await request(app)
        .patch('/api/v1/inventory/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          quantity: 100,
        })
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/inventory/alerts', () => {
    it('should get low stock alerts', async () => {
      // Create a low stock item
      await request(app)
        .post('/api/v1/inventory')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          itemName: 'Low Stock Item',
          category: 'Test',
          quantity: 2,
          unit: 'pcs',
          minStockLevel: 10,
          costPrice: 5,
        });

      const response = await request(app)
        .get('/api/v1/inventory/alerts')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('DELETE /api/v1/inventory/:id', () => {
    it('should delete inventory item', async () => {
      const response = await request(app)
        .delete(`/api/v1/inventory/${inventoryItemId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should fail deleting non-existent item', async () => {
      const response = await request(app)
        .delete('/api/v1/inventory/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });
});
