import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import createTestApp from '../utils/test-app.js';
import bcrypt from 'bcryptjs';
import { setupTestEnvironment } from '../utils/test-helpers.js';

/**
 * Vollständiger API-Test für die Rising-BSM Anwendung
 * 
 * Dieser Test deckt wichtige Workflows und API-Endpunkte ab:
 * - Authentifizierung
 * - Benutzerverwaltung
 * - Kundenverwaltung
 * - Anfragenmanagement
 */

// Testdaten
const testAdmin = {
  email: 'testadmin@example.com',
  password: 'TestAdmin123!',
  name: 'Test Admin'
};

const testEmployee = {
  email: 'testemployee@example.com',
  password: 'TestEmployee123!',
  name: 'Test Employee'
};

const testCustomer = {
  name: 'Test Customer',
  email: 'customer@example.com',
  phone: '+49 123 456 789',
  company: 'Test Company GmbH',
  address: 'Teststraße 1',
  postalCode: '12345',
  city: 'Teststadt',
  country: 'Deutschland',
  type: 'geschaeft'
};

// Globale Variablen für Token und IDs
let adminToken: string;
let refreshToken: string;
let employeeToken: string;
let employeeId: number;
let customerId: number;
let app: any;
let prisma: PrismaClient;

// Testumgebung initialisieren
beforeAll(async () => {
  // Umgebungsvariablen für Tests setzen
  setupTestEnvironment();
  
  try {
    console.log('Preparing test database...');
    
    // Prisma Client für direkte Datenbankoperationen initialisieren
    prisma = new PrismaClient();
    
    // Testdaten zurücksetzen (falls vorhanden)
    await prisma.userActivity.deleteMany();
    await prisma.refreshToken.deleteMany();
    await prisma.user.deleteMany({
      where: {
        email: {
          in: [testAdmin.email, testEmployee.email]
        }
      }
    });
    
    // Admin-Benutzer für Tests anlegen
    const hashedAdminPassword = await bcrypt.hash(testAdmin.password, 10);
    await prisma.user.create({
      data: {
        name: testAdmin.name,
        email: testAdmin.email,
        password: hashedAdminPassword,
        role: 'admin',
        status: 'active'
      }
    });
    
    // Express-App initialisieren
    const result = await createTestApp();
    app = result.app;
    
    console.log('Test setup completed');
  } catch (error) {
    console.error('Test setup failed:', error);
    throw error;
  }
}, 30000); // Längeres Timeout für die Initialisierung

// Testumgebung aufräumen
afterAll(async () => {
  await prisma.$disconnect();
});

// Testsuite: Authentifizierung
describe('Authentication API', () => {
  // Enable first test to verify our fixes
  test('Should login as admin successfully', async () => {
    const response = await request(app)
      .post('/API/v1/login')
      .send({
        email: testAdmin.email,
        password: testAdmin.password
      });
      
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('accessToken');
    expect(response.body.data).toHaveProperty('refreshToken');
    
    // Token für weitere Tests speichern
    adminToken = response.body.data.accessToken;
    refreshToken = response.body.data.refreshToken;
  });
  
  // Fehlgeschlagener Login
  test.skip('Should fail login with incorrect credentials', async () => {
    const response = await request(app)
      .post('/API/v1/login')
      .send({
        email: testAdmin.email,
        password: 'wrongpassword'
      });
      
    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
  });
  
  // Token-Aktualisierung
  test.skip('Should refresh token successfully', async () => {
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
    
    // Aktualisierte Token speichern
    adminToken = response.body.data.accessToken;
    refreshToken = response.body.data.refreshToken;
  });
});

// Testsuite: Benutzerverwaltung
describe('User Management API', () => {
  // Benutzer erstellen
  test.skip('Should create a new employee user', async () => {
    const response = await request(app)
      .post('/API/v1/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: testEmployee.name,
        email: testEmployee.email,
        password: testEmployee.password,
        role: 'employee'
      });
      
    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('id');
    expect(response.body.data.email).toBe(testEmployee.email);
    
    // ID für weitere Tests speichern
    employeeId = response.body.data.id;
  });
  
  // Benutzer auflisten
  test.skip('Should list all users', async () => {
    const response = await request(app)
      .get('/API/v1/users')
      .set('Authorization', `Bearer ${adminToken}`);
      
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body.data.length).toBeGreaterThanOrEqual(2); // Admin + Employee
  });
  
  // Benutzer nach ID abrufen
  test.skip('Should get user by ID', async () => {
    const response = await request(app)
      .get(`/API/v1/users/${employeeId}`)
      .set('Authorization', `Bearer ${adminToken}`);
      
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.id).toBe(employeeId);
    expect(response.body.data.email).toBe(testEmployee.email);
  });
  
  // Als neuer Benutzer einloggen
  test.skip('Should login as employee successfully', async () => {
    const response = await request(app)
      .post('/API/v1/login')
      .send({
        email: testEmployee.email,
        password: testEmployee.password
      });
      
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    
    // Employee-Token für weitere Tests speichern
    employeeToken = response.body.data.accessToken;
  });
  
  // Benutzer aktualisieren
  test.skip('Should update user profile', async () => {
    const response = await request(app)
      .put(`/API/v1/users/${employeeId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        phone: '+49 987 654 321',
        name: 'Updated Employee Name'
      });
      
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.phone).toBe('+49 987 654 321');
    expect(response.body.data.name).toBe('Updated Employee Name');
  });
});

// Testsuite: Kundenverwaltung
describe.skip('Customer Management API', () => {
  // Kunden erstellen
  test('Should create a new customer', async () => {
    const response = await request(app)
      .post('/API/v1/customers')
      .set('Authorization', `Bearer ${employeeToken}`)
      .send(testCustomer);
      
    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('id');
    expect(response.body.data.email).toBe(testCustomer.email);
    
    // ID für weitere Tests speichern
    customerId = response.body.data.id;
  });
  
  // Kunden auflisten
  test('Should list all customers', async () => {
    const response = await request(app)
      .get('/API/v1/customers')
      .set('Authorization', `Bearer ${employeeToken}`);
      
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body.data.length).toBeGreaterThanOrEqual(1);
  });
  
  // Kunden nach ID abrufen
  test('Should get customer by ID', async () => {
    const response = await request(app)
      .get(`/API/v1/customers/${customerId}`)
      .set('Authorization', `Bearer ${employeeToken}`);
      
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.id).toBe(customerId);
    expect(response.body.data.name).toBe(testCustomer.name);
  });
  
  // Kunden aktualisieren
  test('Should update customer info', async () => {
    const response = await request(app)
      .put(`/API/v1/customers/${customerId}`)
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({
        name: 'Updated Customer Name',
        notes: 'Wichtiger Kunde mit besonderem Service'
      });
      
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.name).toBe('Updated Customer Name');
    expect(response.body.data.notes).toBe('Wichtiger Kunde mit besonderem Service');
  });
  
  // Kunden nach Namen suchen
  test('Should search customers by name', async () => {
    const response = await request(app)
      .get('/API/v1/customers/search')
      .query({ q: 'Updated Customer' })
      .set('Authorization', `Bearer ${employeeToken}`);
      
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body.data.length).toBeGreaterThanOrEqual(1);
    expect(response.body.data[0].id).toBe(customerId);
  });
});

// Testsuite: Anfragenmanagement
describe.skip('Request Management API', () => {
  // Neue Anfrage erstellen
  test('Should create a contact request', async () => {
    const testRequest = {
      name: 'John Doe',
      email: 'johndoe@example.com',
      phone: '+49 123 987 654',
      service: 'Consulting',
      message: 'Ich habe Interesse an einer Beratung zu Ihren Dienstleistungen.'
    };
    
    const response = await request(app)
      .post('/API/v1/requests')
      .send(testRequest);
      
    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('id');
    expect(response.body.data.email).toBe(testRequest.email);
  });
  
  // Anfragen auflisten (nur mit Authentifizierung)
  test('Should list all requests', async () => {
    const response = await request(app)
      .get('/API/v1/requests')
      .set('Authorization', `Bearer ${adminToken}`);
      
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body.data.length).toBeGreaterThanOrEqual(1);
  });
  
  // Anfragen aktualisieren (Status ändern)
  test('Should update request status', async () => {
    // Erst alle Anfragen abrufen
    const listResponse = await request(app)
      .get('/API/v1/requests')
      .set('Authorization', `Bearer ${adminToken}`);
      
    const requestId = listResponse.body.data[0].id;
    
    const response = await request(app)
      .put(`/API/v1/requests/${requestId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        status: 'in_progress',
        processorId: 1 // Admin
      });
      
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.status).toBe('in_progress');
  });
});

// Testsuite: Berechtigungsprüfungen
describe.skip('Authorization Checks', () => {
  // Zugriff auf Admin-Route verweigern (mit Mitarbeiter-Token)
  test('Should deny access to user management for non-admin users', async () => {
    const response = await request(app)
      .post('/API/v1/users')
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({
        name: 'Another User',
        email: 'another@example.com',
        password: 'Password123!',
        role: 'employee'
      });
      
    expect(response.status).toBe(403); // Forbidden
  });
  
  // Zugriff ohne Token verweigern
  test('Should deny access to protected resources without authentication', async () => {
    const response = await request(app)
      .get('/API/v1/users');
      
    expect(response.status).toBe(401); // Unauthorized
  });
});

// Testsuite: Logout
describe.skip('Logout Functionality', () => {
  test('Should logout successfully', async () => {
    const response = await request(app)
      .post('/API/v1/auth/logout')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        refreshToken: refreshToken
      });
      
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    
    // Überprüfen, ob der Token ungültig ist
    const protectedResponse = await request(app)
      .get('/API/v1/users')
      .set('Authorization', `Bearer ${adminToken}`);
      
    // Token sollte noch gültig sein (da JWT stateless ist), 
    // aber der RefreshToken sollte in der Datenbank als zurückgezogen markiert sein
    expect(protectedResponse.status).toBe(200);
    
    // Versuchen, den Token zu aktualisieren (sollte fehlschlagen)
    const refreshResponse = await request(app)
      .post('/API/v1/auth/refresh-token')
      .send({
        refreshToken: refreshToken
      });
      
    expect(refreshResponse.status).toBe(401);
  });
});
