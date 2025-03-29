/**
 * Test customer data fixtures
 */

// Standard test customer
export const testCustomer = {
  id: 1,
  name: 'Test Customer',
  email: 'customer@example.com',
  phone: '+49 123 456 789',
  company: 'Test Company GmbH',
  address: 'Teststraße 1',
  postalCode: '12345',
  city: 'Teststadt',
  country: 'Deutschland',
  status: 'active',
  type: 'business',
  newsletter: true,
  notes: 'Test customer notes',
  createdAt: new Date(),
  updatedAt: new Date()
};

// Business customer
export const businessCustomer = {
  id: 2,
  name: 'Business Customer',
  email: 'business@example.com',
  phone: '+49 987 654 321',
  company: 'Business Solutions GmbH',
  address: 'Geschäftsstraße 10',
  postalCode: '54321',
  city: 'Businessstadt',
  country: 'Deutschland',
  status: 'active',
  type: 'business',
  newsletter: true,
  notes: 'Important business customer',
  createdAt: new Date(),
  updatedAt: new Date()
};

// Private customer
export const privateCustomer = {
  id: 3,
  name: 'Private Customer',
  email: 'private@example.com',
  phone: '+49 111 222 333',
  company: '',
  address: 'Privatstraße 5',
  postalCode: '67890',
  city: 'Privatstadt',
  country: 'Deutschland',
  status: 'active',
  type: 'private',
  newsletter: false,
  notes: 'Private individual',
  createdAt: new Date(),
  updatedAt: new Date()
};

// Inactive customer
export const inactiveCustomer = {
  id: 4,
  name: 'Inactive Customer',
  email: 'inactive-customer@example.com',
  phone: '+49 444 555 666',
  company: 'Inactive GmbH',
  address: 'Inaktivstraße 20',
  postalCode: '09876',
  city: 'Inaktivstadt',
  country: 'Deutschland',
  status: 'inactive',
  type: 'business',
  newsletter: false,
  notes: 'Temporarily inactive',
  createdAt: new Date(),
  updatedAt: new Date()
};

// Generate a test customer with custom properties
export function generateTestCustomer(overrides = {}) {
  const id = Math.floor(Math.random() * 10000);
  return {
    ...testCustomer,
    id,
    email: `customer-${id}@example.com`,
    name: `Test Customer ${id}`,
    ...overrides
  };
}
