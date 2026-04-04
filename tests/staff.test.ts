import request from 'supertest';
import app from '../src/app.js';

describe('Staff API Tests', () => {
  let adminToken: string;
  let staffId: string;

  beforeAll(async () => {
    const response = await request(app)
      .post('/api/v1/auth/login')
      .send({
        username: 'admin',
        password: 'admin123',
      });
    adminToken = response.body.data.accessToken;
  });

  describe('GET /api/v1/staff', () => {
    it('should get all staff as admin', async () => {
      const response = await request(app)
        .get('/api/v1/staff')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .get('/api/v1/staff')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/staff', () => {
    it('should create staff as admin', async () => {
      const response = await request(app)
        .post('/api/v1/staff')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          username: `testuser_${Date.now()}`,
          password: 'test123456',
          role: 'WAITER',
          fullName: 'Test Waiter',
          phone: '1234567890',
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.role).toBe('WAITER');
      staffId = response.body.data.profile.id;
    });

    it('should fail with duplicate username', async () => {
      const username = `duplicate_${Date.now()}`;
      
      await request(app)
        .post('/api/v1/staff')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          username,
          password: 'test123456',
          role: 'CHEF',
          fullName: 'First User',
        });

      const response = await request(app)
        .post('/api/v1/staff')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          username,
          password: 'test123456',
          role: 'CASHIER',
          fullName: 'Second User',
        })
        .expect(409);

      expect(response.body.success).toBe(false);
    });

    it('should fail with invalid role', async () => {
      const response = await request(app)
        .post('/api/v1/staff')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          username: `invalid_${Date.now()}`,
          password: 'test123456',
          role: 'INVALID_ROLE',
          fullName: 'Invalid User',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/staff/:id', () => {
    it('should get staff by id', async () => {
      const response = await request(app)
        .get(`/api/v1/staff/${staffId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('user');
    });

    it('should fail with non-existent id', async () => {
      const response = await request(app)
        .get('/api/v1/staff/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PATCH /api/v1/staff/:id', () => {
    it('should update staff as admin', async () => {
      const response = await request(app)
        .patch(`/api/v1/staff/${staffId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          fullName: 'Updated Waiter Name',
          status: 'ACTIVE',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.fullName).toBe('Updated Waiter Name');
    });
  });

  describe('DELETE /api/v1/staff/:id', () => {
    it('should delete staff as admin', async () => {
      const response = await request(app)
        .delete(`/api/v1/staff/${staffId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should fail deleting non-existent staff', async () => {
      const response = await request(app)
        .delete('/api/v1/staff/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });
});
