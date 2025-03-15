const validators = require('../../utils/validators');
const customers = require('../fixtures/customers.json');
const projects = require('../fixtures/projects.json');
const services = require('../fixtures/services.json');

describe('Validators Integration Tests with Real Data', () => {
  test('validateEmail should properly validate real customer emails', () => {
    // Test with actual customer email addresses
    const emailResults = customers.map(customer => 
      validators.validateEmail(customer.email)
    );
    
    // All customer emails in our fixture should be valid
    emailResults.forEach((result, index) => {
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
    
    // Test with invalid email variations
    const invalidEmails = [
      'not-an-email',
      'missing@domain',
      '@missing-username.com',
      'spaces in@email.com',
      'multiple@@at.com'
    ];
    
    invalidEmails.forEach(email => {
      const result = validators.validateEmail(email);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });
  
  test('validatePhone should properly validate real customer phone numbers', () => {
    // Test with actual customer phone numbers
    const phoneResults = customers.map(customer => 
      validators.validatePhone(customer.telefon)
    );
    
    // Our test data should have valid phone numbers
    phoneResults.forEach((result, index) => {
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });
  
  test('validateNumeric should properly validate real project amounts', () => {
    // Test with actual project amounts
    const amountResults = projects.map(project => 
      validators.validateNumeric(project.betrag, { min: 0 })
    );
    
    // Project amounts should all be valid positive numbers
    amountResults.forEach((result, index) => {
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.value).toBe(projects[index].betrag);
    });
  });
  
  test('validateText should properly validate project titles', () => {
    // Test with actual project titles
    const titleResults = projects.map(project => 
      validators.validateText(project.titel, { 
        required: true, 
        minLength: 3, 
        maxLength: 100 
      })
    );
    
    // All project titles should be valid
    titleResults.forEach((result, index) => {
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });
  
  test('validateInput should validate a complete project object', () => {
    // Create schema matching project structure
    const projectSchema = {
      titel: { type: 'text', required: true, minLength: 3 },
      kunde_id: { type: 'numeric', required: true, integer: true },
      dienstleistung_id: { type: 'numeric', required: true, integer: true },
      start_datum: { type: 'date', required: true },
      end_datum: { type: 'date', required: false },
      betrag: { type: 'numeric', required: true, min: 0 },
      status: { type: 'text', required: true }
    };
    
    // Test with a real project
    const result = validators.validateInput(projects[0], projectSchema);
    
    // Should validate successfully
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual({});
    expect(result.validatedData).toHaveProperty('titel');
    expect(result.validatedData).toHaveProperty('betrag');
    expect(result.validatedData).toHaveProperty('start_datum');
  });
  
  test('validateInput should catch real-world validation issues', () => {
    // Create a project with realistic validation problems
    const invalidProject = {
      ...projects[0],
      titel: '', // Empty required field
      betrag: -100, // Negative amount
      start_datum: 'not-a-date', // Invalid date
      end_datum: '2023-02-15' // End date before start date
    };
    
    const projectSchema = {
      titel: { type: 'text', required: true },
      betrag: { type: 'numeric', min: 0 },
      start_datum: { type: 'date' },
      end_datum: { type: 'date', afterDate: '2023-03-15' }
    };
    
    // Run validation
    const result = validators.validateInput(invalidProject, projectSchema);
    
    // Should fail with multiple errors
    expect(result.isValid).toBe(false);
    expect(Object.keys(result.errors)).toHaveLength(4);
    expect(result.errors).toHaveProperty('titel');
    expect(result.errors).toHaveProperty('betrag');
    expect(result.errors).toHaveProperty('start_datum');
    expect(result.errors).toHaveProperty('end_datum');
  });
});
