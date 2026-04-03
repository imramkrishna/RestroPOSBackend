import request from 'supertest';
import app from '../src/app';

describe('Table & Reservation API Tests', () => {
  let adminToken: string;
  let managerToken: string;
  let tableId: string;
  let reservationId: string;

  beforeAll(async () => {
    const response = await request(app)
      .post('/api/v1/auth/login')
      .send({
        username: 'admin',
        password: 'admin123',
      });
    adminToken = response.body.data.accessToken;

    const managerUsername = `reservation_mgr_${Date.now()}`;
    await request(app)
      .post('/api/v1/staff')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        username: managerUsername,
        password: 'test123456',
        role: 'MANAGER',
        fullName: 'Reservation Test Manager',
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
  });

  describe('GET /api/v1/tables', () => {
    it('should get all tables with authentication', async () => {
      const response = await request(app)
        .get('/api/v1/tables')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      if (response.body.data.length > 0) {
        tableId = response.body.data[0].id;
      }
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .get('/api/v1/tables')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/tables', () => {
    it('should create table', async () => {
      const response = await request(app)
        .post('/api/v1/tables')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          tableNumber: `TEST-${Date.now()}`,
          capacity: 4,
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('tableNumber');
      expect(response.body.data.capacity).toBe(4);
    });

    it('should fail with duplicate table number', async () => {
      const tableNumber = `DUP-${Date.now()}`;
      
      await request(app)
        .post('/api/v1/tables')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          tableNumber,
          capacity: 2,
        });

      const response = await request(app)
        .post('/api/v1/tables')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          tableNumber,
          capacity: 4,
        })
        .expect(409);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/tables/:id', () => {
    it('should get table by id', async () => {
      const response = await request(app)
        .get(`/api/v1/tables/${tableId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('status');
    });
  });

  describe('POST /api/v1/reservations', () => {
    it('should create reservation', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);

      const response = await request(app)
        .post('/api/v1/reservations')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          tableId,
          customerName: 'John Doe',
          phone: '1234567890',
          guestCount: 4,
          datetime: futureDate.toISOString(),
          notes: 'Birthday celebration',
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.customerName).toBe('John Doe');
      reservationId = response.body.data.id;
    });

    it('should create reservation with frontend payload fields', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 5);
      const date = futureDate.toISOString().split('T')[0];

      const response = await request(app)
        .post('/api/v1/reservations')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          tableId,
          customerName: 'Frontend User',
          customerPhone: '9998887776',
          partySize: 2,
          date,
          startTime: '18:30',
          endTime: '20:00',
          notes: '',
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.phone).toBe('9998887776');
      expect(response.body.data.guestCount).toBe(2);
    });

    it('should fail with guest count exceeding capacity', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 2);

      const response = await request(app)
        .post('/api/v1/reservations')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          tableId,
          customerName: 'Jane Doe',
          phone: '0987654321',
          guestCount: 100,
          datetime: futureDate.toISOString(),
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/reservations', () => {
    it('should get all reservations', async () => {
      const response = await request(app)
        .get('/api/v1/reservations')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should filter by status', async () => {
      const response = await request(app)
        .get('/api/v1/reservations?status=PENDING')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('GET /api/v1/reservations/:id', () => {
    it('should get reservation by id', async () => {
      const response = await request(app)
        .get(`/api/v1/reservations/${reservationId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('table');
    });
  });

  describe('PATCH /api/v1/reservations/:id', () => {
    it('should update reservation status', async () => {
      const response = await request(app)
        .patch(`/api/v1/reservations/${reservationId}`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          status: 'CONFIRMED',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('CONFIRMED');
    });
  });

  describe('PATCH /api/v1/tables/:id/status', () => {
    it('should update table status', async () => {
      const response = await request(app)
        .patch(`/api/v1/tables/${tableId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'AVAILABLE',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('AVAILABLE');
    });
  });
});
