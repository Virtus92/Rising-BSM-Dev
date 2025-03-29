/**
 * Fixture Utilities for Testing
 * 
 * This file contains utilities for working with test fixtures.
 */
import fs from 'fs';
import path from 'path';
import { faker } from '@faker-js/faker';

/**
 * Load a fixture from file
 * @param fixtureName - Name of the fixture file (without .json extension)
 * @returns Fixture data
 */
export function loadFixture<T>(fixtureName: string): T {
  const fixturePath = path.join(process.cwd(), 'tests', 'fixtures', `${fixtureName}.json`);
  
  if (!fs.existsSync(fixturePath)) {
    throw new Error(`Fixture ${fixtureName} not found at path: ${fixturePath}`);
  }
  
  const fixtureData = fs.readFileSync(fixturePath, 'utf-8');
  return JSON.parse(fixtureData) as T;
}

/**
 * Save fixture data to file
 * @param fixtureName - Name of the fixture file (without .json extension)
 * @param data - Data to save
 */
export function saveFixture<T>(fixtureName: string, data: T): void {
  const fixturesDir = path.join(process.cwd(), 'tests', 'fixtures');
  
  // Create fixtures directory if it doesn't exist
  if (!fs.existsSync(fixturesDir)) {
    fs.mkdirSync(fixturesDir, { recursive: true });
  }
  
  const fixturePath = path.join(fixturesDir, `${fixtureName}.json`);
  fs.writeFileSync(fixturePath, JSON.stringify(data, null, 2));
}

/**
 * Generate fake user data
 * @param count - Number of users to generate
 * @returns Array of user data
 */
export function generateFakeUsers(count: number = 1): any[] {
  return Array.from({ length: count }, (_, i) => ({
    name: faker.person.fullName(),
    email: faker.internet.email(),
    password: 'Password123!', // Same password for all test users
    role: faker.helpers.arrayElement(['admin', 'manager', 'employee']),
    status: 'active',
    phone: faker.phone.number(),
    createdAt: faker.date.recent(),
    updatedAt: faker.date.recent()
  }));
}

/**
 * Generate fake customer data
 * @param count - Number of customers to generate
 * @returns Array of customer data
 */
export function generateFakeCustomers(count: number = 1): any[] {
  return Array.from({ length: count }, (_, i) => ({
    name: faker.person.fullName(),
    email: faker.internet.email(),
    phone: faker.phone.number(),
    company: faker.company.name(),
    address: faker.location.streetAddress(),
    postalCode: faker.location.zipCode(),
    city: faker.location.city(),
    country: faker.location.country(),
    status: faker.helpers.arrayElement(['active', 'inactive', 'prospect']),
    type: faker.helpers.arrayElement(['private', 'business']),
    newsletter: faker.datatype.boolean(),
    notes: faker.lorem.paragraph(),
    createdAt: faker.date.recent(),
    updatedAt: faker.date.recent()
  }));
}

/**
 * Generate fake contact requests
 * @param count - Number of requests to generate
 * @returns Array of contact request data
 */
export function generateFakeContactRequests(count: number = 1): any[] {
  return Array.from({ length: count }, (_, i) => ({
    name: faker.person.fullName(),
    email: faker.internet.email(),
    phone: faker.phone.number(),
    service: faker.helpers.arrayElement(['facility', 'moving', 'winter', 'other']),
    message: faker.lorem.paragraph(),
    status: faker.helpers.arrayElement(['neu', 'in_bearbeitung', 'beantwortet', 'geschlossen']),
    ipAddress: faker.internet.ip(),
    createdAt: faker.date.recent(),
    updatedAt: faker.date.recent()
  }));
}

/**
 * Create standard fixtures for tests
 * This can be run once to set up fixtures for all tests
 */
export function createStandardFixtures(): void {
  // Create users fixture
  const users = [
    {
      name: 'Test Admin',
      email: 'testadmin@example.com',
      password: 'TestAdmin123!',
      role: 'admin',
      status: 'active'
    },
    {
      name: 'Test Manager',
      email: 'testmanager@example.com',
      password: 'TestManager123!',
      role: 'manager',
      status: 'active'
    },
    {
      name: 'Test Employee',
      email: 'testemployee@example.com',
      password: 'TestEmployee123!',
      role: 'employee',
      status: 'active'
    },
    ...generateFakeUsers(10)
  ];
  saveFixture('users', users);
  
  // Create customers fixture
  const customers = [
    {
      name: 'Test Customer',
      email: 'testcustomer@example.com',
      phone: '+49 123 456 789',
      company: 'Test GmbH',
      address: 'Teststraße 123',
      postalCode: '12345',
      city: 'Berlin',
      country: 'Germany',
      status: 'active',
      type: 'business',
      newsletter: true,
      notes: 'Test customer for automated tests'
    },
    ...generateFakeCustomers(20)
  ];
  saveFixture('customers', customers);
  
  // Create contact requests fixture
  const requests = [
    {
      name: 'Test Request',
      email: 'testrequest@example.com',
      phone: '+49 987 654 321',
      service: 'facility',
      message: 'This is a test request for automated tests',
      status: 'neu',
      ipAddress: '127.0.0.1'
    },
    ...generateFakeContactRequests(10)
  ];
  saveFixture('requests', requests);
  
  console.log('Standard fixtures created');
}
