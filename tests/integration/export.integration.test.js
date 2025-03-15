const fs = require('fs');
const path = require('path');
const { generateExport } = require('../../services/export.service');
const customers = require('../fixtures/customers.json');

describe('Export Service Integration Tests', () => {
  const outputDir = path.join(__dirname, '../temp');
  
  beforeAll(() => {
    // Create temp directory if it doesn't exist
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir);
    }
  });
  
  afterAll(() => {
    // Clean up test output files
    const files = fs.readdirSync(outputDir);
    for (const file of files) {
      fs.unlinkSync(path.join(outputDir, file));
    }
  });
  
  test('should export real customer data to CSV', async () => {
    const columns = [
      { key: 'id', header: 'ID' },
      { key: 'name', header: 'Name' },
      { key: 'email', header: 'Email' },
      { key: 'telefon', header: 'Phone' },
      { key: 'status', header: 'Status' }
    ];
    
    const options = {
      filename: 'customer-export',
      title: 'Customer Export',
      columns
    };
    
    const result = await generateExport(customers, 'csv', options);
    
    // Check export metadata
    expect(result.contentType).toBe('text/csv');
    expect(result.filename).toBe('customer-export.csv');
    
    // Write export to file for manual inspection if needed
    fs.writeFileSync(path.join(outputDir, result.filename), result.data);
    
    // Verify CSV contains expected data
    const csv = result.data;
    expect(csv).toContain('ID,Name,Email,Phone,Status');
    expect(csv).toContain('1,"ACME Corporation","contact@acme.com","123-456-7890","aktiv"');
    expect(csv).toContain('2,"John Smith","john.smith@example.com","987-654-3210","aktiv"');
  });
  
  test('should apply formatting functions to data', async () => {
    const columns = [
      { key: 'name', header: 'Name' },
      { 
        key: 'status', 
        header: 'Status',
        format: (val) => val === 'aktiv' ? 'Active' : 'Inactive'
      },
      {
        key: 'created_at',
        header: 'Created On',
        format: (val) => {
          const date = new Date(val);
          return `${date.getDate()}.${date.getMonth()+1}.${date.getFullYear()}`;
        }
      }
    ];
    
    const options = {
      filename: 'formatted-export',
      title: 'Formatted Export',
      columns
    };
    
    const result = await generateExport(customers, 'csv', options);
    
    // Check export has formatted values
    const csv = result.data;
    expect(csv).toContain('Name,Status,Created On');
    expect(csv).toContain('"ACME Corporation","Active","15.1.2023"');
    expect(csv).toContain('"Tech Solutions GmbH","Inactive","5.11.2022"');
  });
});
