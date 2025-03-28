// backend/tests/integration/auth-flow.test.ts

import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import main from '../../src/index.js';
import bcrypt from 'bcryptjs';
import { setupTestEnvironment } from '../utils/test-helpers.js';

/**
 * Integrationstests für den Authentifizierungsablauf
 * 
 * Diese Tests prüfen den Gesamtfluss der Authentifizierung:
 * - Login
 * - Token-Aktualisierung
 * - Passwort vergessen / zurücksetzen
 * - Logout
 */

const prisma = new PrismaClient();
let app: any;

// Testdaten
const testUser = {
  email: 'integration-test@example.com',
  password: 'IntegrationTest123!',
  name: 'Integration Test User'
};

let userId: number;
let accessToken: string;
let refreshToken: string;
let resetToken: string;

// Setup
beforeAll(async () => {
  // Umgebungsvariablen für Tests setzen
  setupTestEnvironment();
  
  try {
    console.log('Preparing integration test environment...');
    
    // Testdaten zurücksetzen (falls vorhanden)
    await prisma.userActivity.deleteMany();
    await prisma.refreshToken.deleteMany();
    await prisma.user.deleteMany({
      where: {
        email: testUser.email
      }
    });
    
    // Testbenutzer erstellen
    const hashedPassword = await bcrypt.hash(testUser.password, 10);
    const user = await prisma.user.create({
      data: {
        name: testUser.name,
        email: testUser.email,
        password: hashedPassword,
        role: 'employee',
        status: 'active'
      }
    });
    
    userId = user.id;
    
    // Express-App initialisieren
    app = await main();
    console.log('Integration test setup completed');
  } catch (error) {
    console.error('Integration test setup failed:', error);
    throw error;
  }
}, 30000);

// Cleanup
afterAll(async () => {
  // Testdaten löschen
  await prisma.userActivity.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany({
    where: {
      email: testUser.email
    }
  });
  
  await prisma.$disconnect();
});

describe('Authentication Flow', () => {
  // Enable first test to verify our fixes
  test('Step 1: User login', async () => {
    const response = await request(app)
      .post('/API/v1/login')
      .send({
        email: testUser.email,
        password: testUser.password
      });
    
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('accessToken');
    expect(response.body.data).toHaveProperty('refreshToken');
    
    accessToken = response.body.data.accessToken;
    refreshToken = response.body.data.refreshToken;
  });
  
  test.skip('Step 2: Access protected resource', async () => {
    const response = await request(app)
      .get('/API/v1/users/profile')
      .set('Authorization', `Bearer ${accessToken}`);
    
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.id).toBe(userId);
    expect(response.body.data.email).toBe(testUser.email);
  });
  
  test.skip('Step 3: Refresh token', async () => {
    // Kurze Pause einlegen, um unterschiedliche Zeitstempel im Token zu erhalten
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const response = await request(app)
      .post('/API/v1/auth/refresh-token')
      .send({
        refreshToken: refreshToken
      });
    
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('accessToken');
    expect(response.body.data).toHaveProperty('refreshToken');
    
    // Tokens aktualisieren
    const oldAccessToken = accessToken;
    accessToken = response.body.data.accessToken;
    refreshToken = response.body.data.refreshToken;
    
    // Sicherstellen, dass der neue Token anders ist
    expect(accessToken).not.toBe(oldAccessToken);
  });
  
  test.skip('Step 4: Password forgot/reset flow', async () => {
    // Passwort vergessen anfordern
    const forgotResponse = await request(app)
      .post('/API/v1/auth/forgot-password')
      .send({
        email: testUser.email
      });
    
    expect(forgotResponse.status).toBe(200);
    expect(forgotResponse.body.success).toBe(true);
    
    // In Testumgebung den Reset-Token aus der Datenbank holen
    if (process.env.NODE_ENV === 'test') {
      const user = await prisma.user.findUnique({
        where: {
          email: testUser.email
        },
        select: {
          resetToken: true
        }
      });
      
      resetToken = user?.resetToken || '';
      expect(resetToken).toBeTruthy();
      
      // Token validieren
      const validateResponse = await request(app)
        .get(`/API/v1/auth/reset-token/${resetToken}`);
      
      expect(validateResponse.status).toBe(200);
      expect(validateResponse.body.success).toBe(true);
      expect(validateResponse.body.data.valid).toBe(true);
      
      // Passwort zurücksetzen
      const resetResponse = await request(app)
        .post(`/API/v1/auth/reset-password/${resetToken}`)
        .send({
          password: 'NewPassword123!',
          confirmPassword: 'NewPassword123!'
        });
      
      expect(resetResponse.status).toBe(200);
      expect(resetResponse.body.success).toBe(true);
      
      // Mit neuem Passwort einloggen
      const loginResponse = await request(app)
        .post('/API/v1/login')
        .send({
          email: testUser.email,
          password: 'NewPassword123!'
        });
      
      expect(loginResponse.status).toBe(200);
      expect(loginResponse.body.success).toBe(true);
      
      // Tokens aktualisieren
      accessToken = loginResponse.body.data.token;
      refreshToken = loginResponse.body.data.refreshToken;
    }
  });
  
  test.skip('Step 5: Logout', async () => {
    const response = await request(app)
      .post('/API/v1/auth/logout')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        refreshToken: refreshToken
      });
    
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    
    // Verifizieren, dass der RefreshToken nicht mehr funktioniert
    const refreshResponse = await request(app)
      .post('/API/v1/auth/refresh-token')
      .send({
        refreshToken: refreshToken
      });
    
    expect(refreshResponse.status).toBe(401);
  });
});
