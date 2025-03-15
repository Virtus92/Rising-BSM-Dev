const formatters = require('../../utils/formatters');
const customers = require('../fixtures/customers.json');

describe('Formatters Integration Tests', () => {
  test('formatPhone works with real customer phone numbers', () => {
    // Test with various real phone number formats from our data
    const formattedPhones = customers.map(customer => 
      formatters.formatPhone(customer.telefon)
    );
    
    // Ensure all phone numbers are formatted correctly
    expect(formattedPhones[0]).toBe('123 456 7890');
    expect(formattedPhones[1]).toBe('987 654 3210');
    expect(formattedPhones[2]).toBe('030 123 456 78');
    
    // Make sure none of the phone numbers contain dashes
    formattedPhones.forEach(phone => {
      expect(phone).not.toContain('-');
    });
  });
  
  test('formatDateWithLabel correctly processes real creation dates', () => {
    // Format all the creation dates from our customer data
    const formattedDates = customers.map(customer => 
      formatters.formatDateWithLabel(customer.created_at)
    );
    
    // Verify expected structure and formatting
    formattedDates.forEach(dateObj => {
      expect(dateObj).toHaveProperty('label');
      expect(dateObj).toHaveProperty('fullDate');
      expect(dateObj).toHaveProperty('class');
      
      // Formatted date should be in DD.MM.YYYY format
      expect(dateObj.fullDate).toMatch(/\d{2}\.\d{2}\.\d{4}/);
    });
  });
});
