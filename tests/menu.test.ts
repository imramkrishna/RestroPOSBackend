import request from 'supertest';
import app from '../src/app.js';

describe('Menu API Tests', () => {
  let adminToken: string;
  let categoryId: string;
  let menuItemId: string;

  beforeAll(async () => {
    const response = await request(app)
      .post('/api/v1/auth/login')
      .send({
        username: 'admin',
        password: 'admin123',
      });
    adminToken = response.body.data.accessToken;
  });

  describe('GET /api/v1/menu', () => {
    it('should get full menu without authentication', async () => {
      const response = await request(app)
        .get('/api/v1/menu')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('POST /api/v1/menu/categories', () => {
    it('should create category as admin', async () => {
      const response = await request(app)
        .post('/api/v1/menu/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Test Category',
          icon: '🍕',
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.name).toBe('Test Category');
      categoryId = response.body.data.id;
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .post('/api/v1/menu/categories')
        .send({
          name: 'Another Category',
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should fail with duplicate category name', async () => {
      const response = await request(app)
        .post('/api/v1/menu/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Test Category',
          icon: '🍔',
        })
        .expect(409);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/menu/items', () => {
    it('should create menu item as admin', async () => {
      // Get a category first
      const menuResponse = await request(app).get('/api/v1/menu');
      const categories = menuResponse.body.data;
      const testCategoryId = categories.length > 0 ? categories[0].id : categoryId;

      const response = await request(app)
        .post('/api/v1/menu/items')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          categoryId: testCategoryId,
          name: 'Test Menu Item',
          description: 'Delicious test item',
          price: 12.99,
          isAvailable: true,
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.name).toBe('Test Menu Item');
      expect(response.body.data.price).toBe(12.99);
      menuItemId = response.body.data.id;
    });

    it('should fail with invalid category', async () => {
      const response = await request(app)
        .post('/api/v1/menu/items')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          categoryId: '00000000-0000-0000-0000-000000000000',
          name: 'Invalid Item',
          price: 10,
        })
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PATCH /api/v1/menu/items/:id', () => {
    it('should update menu item as admin', async () => {
      const response = await request(app)
        .patch(`/api/v1/menu/items/${menuItemId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          price: 15.99,
          isAvailable: false,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.price).toBe(15.99);
      expect(response.body.data.isAvailable).toBe(false);
    });

    it('should fail with non-existent item', async () => {
      const response = await request(app)
        .patch('/api/v1/menu/items/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          price: 20,
        })
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/v1/menu/items/:id', () => {
    it('should archive menu item as admin', async () => {
      const response = await request(app)
        .delete(`/api/v1/menu/items/${menuItemId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should fail with non-existent item', async () => {
      const response = await request(app)
        .delete('/api/v1/menu/items/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });
});
