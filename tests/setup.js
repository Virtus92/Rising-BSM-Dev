// Test setup file for Rising BSM
const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env.test') });

// Create a test database connection pool
const pool = new Pool({
  user: process.env.TEST_DB_USER || process.env.DB_USER,
  host: process.env.TEST_DB_HOST || process.env.DB_HOST,
  database: process.env.TEST_DB_DATABASE || process.env.DB_DATABASE + '_test',
  password: process.env.TEST_DB_PASSWORD || process.env.DB_PASSWORD,
  port: process.env.TEST_DB_PORT || process.env.DB_PORT,
});

// Function to setup test database
async function setupTestDB() {
  // Read schema file and execute it
  const fs = require('fs');
  const schema = fs.readFileSync(path.join(__dirname, '../sql/schema.sql'), 'utf8');
  
  try {
    // Reset the database
    await pool.query('DROP SCHEMA public CASCADE; CREATE SCHEMA public;');
    
    // Apply schema
    await pool.query(schema);
    
    // Add test data
    await addTestData();
    
    console.log('Test database setup completed');
  } catch (error) {
    console.error('Error setting up test database:', error);
    throw error;
  }
}

// Function to add test data
async function addTestData() {
  // Add test user
  await pool.query(`
    INSERT INTO benutzer (name, email, passwort, rolle) 
    VALUES ('Test User', 'test@example.com', '$2y$12$r4Ucse3qbXN/kGavyQmokuYRLFGdHWRHB6VELvVdkyTzbub/jc3i.', 'admin')
  `);
  
  // Add test customer
  await pool.query(`
    INSERT INTO kunden (name, email, telefon, status, kundentyp)
    VALUES ('Test Kunde', 'kunde@example.com', '+43123456789', 'aktiv', 'privat')
  `);
  
  // Add test service
  await pool.query(`
    INSERT INTO dienstleistungen (name, beschreibung, preis_basis, einheit, mwst_satz, aktiv)
    VALUES ('Test Service', 'Beschreibung', 100.00, 'Stunde', 20.00, true)
  `);
  
  // Add test contact request
  await pool.query(`
    INSERT INTO kontaktanfragen (name, email, service, message, status)
    VALUES ('Test Anfrage', 'anfrage@example.com', 'facility', 'Test message', 'neu')
  `);
}

// Clear test data after tests
async function clearTestData() {
  try {
    await pool.query('DELETE FROM anfragen_notizen');
    await pool.query('DELETE FROM kontaktanfragen');
    await pool.query('DELETE FROM termin_notizen');
    await pool.query('DELETE FROM termine');
    await pool.query('DELETE FROM projekt_notizen');
    await pool.query('DELETE FROM projekte');
    await pool.query('DELETE FROM dienstleistungen');
    await pool.query('DELETE FROM kunden');
    await pool.query('DELETE FROM benutzer');
    
    console.log('Test data cleared');
  } catch (error) {
    console.error('Error clearing test data:', error);
    throw error;
  }
}

// Close database connection
async function closeTestDB() {
  await pool.end();
  console.log('Test database connection closed');
}

module.exports = {
  pool,
  setupTestDB,
  clearTestData,
  closeTestDB
};