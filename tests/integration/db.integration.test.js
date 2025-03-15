/**
 * Database Integration Tests
 * 
 * These tests connect to a real test database.
 * To run these tests:
 * 1. Set up a test database
 * 2. Configure connection in .env.test
 * 3. Run with: npm run test:integration
 */

const dbService = require('../../services/db.service');
const customers = require('../fixtures/customers.json');

// Only run these tests if TEST_DB environment flag is set
const runTests = process.env.TEST_DB === 'true';

// Use conditional test function to skip if not enabled
const testIf = (condition) => condition ? test : test.skip;

describe('Database Service Integration Tests', () => {
  beforeAll(async () => {
    if (runTests) {
      try {
        // Prüfen der Datenbankverbindung vor dem Testlauf
        const testConnection = await dbService.query('SELECT 1 as test');
        if (!testConnection || !testConnection.rows || !testConnection.rows[0].test) {
          console.error('Test-Datenbankverbindung fehlgeschlagen. Überspringen von Integration Tests.');
          process.env.TEST_DB = 'false';
          return;
        }
        
        console.log('Test-Datenbankverbindung erfolgreich. Führe Integration Tests aus.');
        
        // Bereinigung und Einrichtung der Testdaten
        await dbService.query('DELETE FROM kunden');
        
        // Insert test customers one by one
        for (const customer of customers) {
          await dbService.insert('kunden', {
            id: customer.id,
            name: customer.name,
            email: customer.email,
            telefon: customer.telefon,
            firma: customer.firma,
            adresse: customer.adresse,
            plz: customer.plz,
            ort: customer.ort,
            status: customer.status,
            kundentyp: customer.kundentyp
          });
        }
      } catch (error) {
        console.error('Fehler beim Einrichten der Test-Datenbank:', error);
        process.env.TEST_DB = 'false';
      }
    }
  });
  
  testIf(runTests)('should retrieve customer by id', async () => {
    const result = await dbService.getById('kunden', 1);
    
    expect(result).toBeDefined();
    expect(result.id).toBe(1);
    expect(result.name).toBe('ACME Corporation');
    expect(result.email).toBe('contact@acme.com');
  });
  
  testIf(runTests)('should update customer data', async () => {
    const updatedData = {
      telefon: '123-555-7890',
      adresse: 'New Address 42'
    };
    
    const result = await dbService.update('kunden', 2, updatedData);
    
    expect(result).toBeDefined();
    expect(result.id).toBe(2);
    expect(result.telefon).toBe('123-555-7890');
    expect(result.adresse).toBe('New Address 42');
    
    // Verify with separate query
    const customer = await dbService.getById('kunden', 2);
    expect(customer.telefon).toBe('123-555-7890');
  });
  
  testIf(runTests)('should delete customer', async () => {
    // First verify customer exists
    const beforeDelete = await dbService.getById('kunden', 3);
    expect(beforeDelete).not.toBeNull();
    
    // Perform delete operation
    const deleted = await dbService.delete('kunden', 3);
    expect(deleted).toBe(true);
    
    // Verify customer no longer exists
    const afterDelete = await dbService.getById('kunden', 3);
    expect(afterDelete).toBeNull();
  });
  
  testIf(runTests)('sollte Transaktionen korrekt ausführen', async () => {
    // Umhüllen in try-catch für bessere Fehlerbehandlung
    try {
      // Test für erfolgreiche Transaktion
      await dbService.transaction(async (client) => {
        await client.query('UPDATE kunden SET telefon = $1 WHERE id = $2', ['555-123-4567', 1]);
        await client.query('UPDATE kunden SET email = $1 WHERE id = $2', ['updated@example.com', 1]);
      });
      
      // Überprüfen, ob beide Updates erfolgreich waren
      const updatedCustomer = await dbService.getById('kunden', 1);
      expect(updatedCustomer.telefon).toBe('555-123-4567');
      expect(updatedCustomer.email).toBe('updated@example.com');
      
      // Test für Transaktion mit Rollback
      let rollbackOccurred = false;
      try {
        await dbService.transaction(async (client) => {
          await client.query('UPDATE kunden SET telefon = $1 WHERE id = $2', ['999-999-9999', 1]);
          // Eine Abfrage, die fehlschlagen sollte
          await client.query('UPDATE nicht_existierende_tabelle SET wert = 1');
        });
      } catch (error) {
        rollbackOccurred = true;
      }
      
      expect(rollbackOccurred).toBe(true);
      
      // Überprüfen, ob das erste Update zurückgesetzt wurde
      const afterRollbackCustomer = await dbService.getById('kunden', 1);
      expect(afterRollbackCustomer.telefon).not.toBe('999-999-9999');
      expect(afterRollbackCustomer.telefon).toBe('555-123-4567');
    } catch (error) {
      fail(`Test sollte nicht fehlschlagen: ${error.message}`);
    }
  });
  
  afterAll(async () => {
    if (runTests) {
      // Clean up test data
      await dbService.query('DELETE FROM kunden');
    }
  });
});
