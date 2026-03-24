#!/usr/bin/env tsx

import axios from 'axios';

const BASE_URL = 'http://localhost:3000';
const API_URL = `${BASE_URL}/api/v1`;

interface TestResult {
  name: string;
  status: 'PASS' | 'FAIL';
  message?: string;
}

const results: TestResult[] = [];
let adminToken = '';

async function test(name: string, fn: () => Promise<void>) {
  try {
    await fn();
    results.push({ name, status: 'PASS' });
    console.log(`✅ ${name}`);
  } catch (error: any) {
    results.push({ 
      name, 
      status: 'FAIL', 
      message: error.response?.data?.message || error.message 
    });
    console.log(`❌ ${name}: ${error.response?.data?.message || error.message}`);
  }
}

async function runTests() {
  console.log('\n🧪 Starting API Tests...\n');

  // Health Check
  await test('Health Check', async () => {
    const response = await axios.get(`${BASE_URL}/health`);
    if (!response.data.success) throw new Error('Health check failed');
  });

  // Authentication Tests
  await test('Login with valid credentials', async () => {
    const response = await axios.post(`${API_URL}/auth/login`, {
      username: 'admin',
      password: 'admin123',
    });
    if (!response.data.data.accessToken) throw new Error('No access token');
    adminToken = response.data.data.accessToken;
  });

  await test('Login with invalid credentials', async () => {
    try {
      await axios.post(`${API_URL}/auth/login`, {
        username: 'admin',
        password: 'wrongpass',
      });
      throw new Error('Should have failed');
    } catch (error: any) {
      if (error.response?.status !== 401) throw error;
    }
  });

  await test('Get current user', async () => {
    const response = await axios.get(`${API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (!response.data.data.username) throw new Error('No username');
  });

  // Menu Tests
  let menuItemId = '';
  let categoryId = '';

  await test('Get full menu', async () => {
    const response = await axios.get(`${API_URL}/menu`);
    if (!Array.isArray(response.data.data)) throw new Error('Invalid response');
    if (response.data.data.length > 0) {
      categoryId = response.data.data[0].id;
      if (response.data.data[0].menuItems?.length > 0) {
        menuItemId = response.data.data[0].menuItems[0].id;
      }
    }
  });

  await test('Create category', async () => {
    const response = await axios.post(
      `${API_URL}/menu/categories`,
      {
        name: `Test Category ${Date.now()}`,
        icon: '🍕',
      },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    if (!response.data.data.id) throw new Error('No category ID');
    categoryId = response.data.data.id;
  });

  await test('Create menu item', async () => {
    const response = await axios.post(
      `${API_URL}/menu/items`,
      {
        categoryId,
        name: `Test Item ${Date.now()}`,
        price: 15.99,
        description: 'Test item',
      },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    if (!response.data.data.id) throw new Error('No item ID');
    menuItemId = response.data.data.id;
  });

  // Staff Tests
  let staffId = '';

  await test('Get all staff', async () => {
    const response = await axios.get(`${API_URL}/staff`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (!Array.isArray(response.data.data)) throw new Error('Invalid response');
  });

  await test('Create staff', async () => {
    const response = await axios.post(
      `${API_URL}/staff`,
      {
        username: `testuser_${Date.now()}`,
        password: 'test123456',
        role: 'WAITER',
        fullName: 'Test User',
      },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    if (!response.data.data.id) throw new Error('No staff ID');
    staffId = response.data.data.id;
  });

  // Table Tests
  let tableId = '';

  await test('Get all tables', async () => {
    const response = await axios.get(`${API_URL}/tables`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (!Array.isArray(response.data.data)) throw new Error('Invalid response');
    if (response.data.data.length > 0) {
      tableId = response.data.data[0].id;
    }
  });

  // Order Tests
  let orderId = '';

  if (menuItemId && tableId) {
    await test('Create order', async () => {
      const response = await axios.post(
        `${API_URL}/orders`,
        {
          tableId,
          items: [
            {
              menuItemId,
              quantity: 2,
              notes: 'Test order',
            },
          ],
        },
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );
      if (!response.data.data.id) throw new Error('No order ID');
      orderId = response.data.data.id;
    });

    await test('Get all orders', async () => {
      const response = await axios.get(`${API_URL}/orders`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      if (!Array.isArray(response.data.data)) throw new Error('Invalid response');
    });

    await test('Update order status', async () => {
      const response = await axios.patch(
        `${API_URL}/orders/${orderId}/status`,
        { status: 'COOKING' },
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );
      if (response.data.data.status !== 'COOKING') throw new Error('Status not updated');
    });

    await test('Process payment', async () => {
      const response = await axios.post(
        `${API_URL}/orders/${orderId}/pay`,
        { paymentMethod: 'CASH' },
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );
      if (response.data.data.status !== 'COMPLETED') throw new Error('Order not completed');
    });
  }

  // Inventory Tests
  let inventoryId = '';

  await test('Create inventory item', async () => {
    const response = await axios.post(
      `${API_URL}/inventory`,
      {
        itemName: `Test Item ${Date.now()}`,
        category: 'Test',
        quantity: 100,
        unit: 'pcs',
        minStockLevel: 10,
        costPrice: 5.0,
      },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    if (!response.data.data.id) throw new Error('No inventory ID');
    inventoryId = response.data.data.id;
  });

  await test('Get all inventory', async () => {
    const response = await axios.get(`${API_URL}/inventory`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (!Array.isArray(response.data.data)) throw new Error('Invalid response');
  });

  await test('Update inventory quantity', async () => {
    const response = await axios.patch(
      `${API_URL}/inventory/${inventoryId}`,
      { quantity: 150 },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    if (response.data.data.quantity !== 150) throw new Error('Quantity not updated');
  });

  // Reservation Tests
  let reservationId = '';

  if (tableId) {
    await test('Create reservation', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);

      const response = await axios.post(
        `${API_URL}/reservations`,
        {
          tableId,
          customerName: 'John Doe',
          phone: '1234567890',
          guestCount: 4,
          datetime: futureDate.toISOString(),
        },
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );
      if (!response.data.data.id) throw new Error('No reservation ID');
      reservationId = response.data.data.id;
    });

    await test('Get all reservations', async () => {
      const response = await axios.get(`${API_URL}/reservations`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      if (!Array.isArray(response.data.data)) throw new Error('Invalid response');
    });
  }

  // Summary
  console.log('\n📊 Test Summary:\n');
  const passed = results.filter((r) => r.status === 'PASS').length;
  const failed = results.filter((r) => r.status === 'FAIL').length;
  
  console.log(`Total: ${results.length}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  
  if (failed > 0) {
    console.log('\n❌ Failed Tests:');
    results
      .filter((r) => r.status === 'FAIL')
      .forEach((r) => console.log(`  - ${r.name}: ${r.message}`));
  }

  process.exit(failed > 0 ? 1 : 0);
}

// Check if server is running
axios.get(`${BASE_URL}/health`)
  .then(() => {
    runTests();
  })
  .catch(() => {
    console.log('❌ Server is not running. Please start the server first with: npm run dev');
    process.exit(1);
  });
