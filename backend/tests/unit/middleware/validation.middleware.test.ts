import { Request, Response } from 'express';
import { validateCustomer, validateProject, validateAppointment, validateService, validateContactForm } from '../../../middleware/validation.middleware';
import { ValidationError } from '../../../utils/errors';
import { describe, test, expect, beforeEach, jest } from '@jest/globals';

describe('Validation Middleware', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: jest.Mock;
  
  beforeEach(() => {
    res = {};
    next = jest.fn();
  });
  
  describe('validateCustomer', () => {
    test('should validate valid customer data', () => {
      req = {
        body: {
          name: 'Test Customer',
          email: 'test@example.com',
          firma: 'Test Company'
        }
      };
      
      validateCustomer(req as Request, res as Response, next);
      
      expect(next).toHaveBeenCalled();
      expect(next).not.toHaveBeenCalledWith(expect.any(Error));
    });
    
    test('should reject invalid customer data', () => {
      req = {
        body: {
          name: '',  // Invalid: required
          email: 'invalid-email'  // Invalid format
        }
      };
      
      validateCustomer(req as Request, res as Response, next);
      
      expect(next).toHaveBeenCalledWith(expect.any(ValidationError));
    });
  });
  
  describe('validateProject', () => {
    test('should validate valid project data', () => {
      req = {
        body: {
          titel: 'Test Project',
          start_datum: '2023-01-01',
          end_datum: '2023-02-01'
        }
      };
      
      validateProject(req as Request, res as Response, next);
      
      expect(next).toHaveBeenCalled();
      expect(next).not.toHaveBeenCalledWith(expect.any(Error));
    });
    
    test('should reject project with end date before start date', () => {
      req = {
        body: {
          titel: 'Test Project',
          start_datum: '2023-02-01',
          end_datum: '2023-01-01'  // Invalid: before start date
        }
      };
      
      validateProject(req as Request, res as Response, next);
      
      expect(next).toHaveBeenCalledWith(expect.any(ValidationError));
    });

    test('should reject project without title', () => {
      req = {
        body: {
          start_datum: '2023-01-01',
          end_datum: '2023-02-01'
        }
      };
      
      validateProject(req as Request, res as Response, next);
      
      expect(next).toHaveBeenCalledWith(expect.any(ValidationError));
    });
  });
  
  describe('validateAppointment', () => {
    test('should validate valid appointment data', () => {
      // Mock current date to ensure appointment is in future
      const realDate = Date;
      const mockDate = new Date(2023, 0, 1); // January 1, 2023
      global.Date = class extends Date {
        constructor() {
          super();
          return mockDate;
        }
        static now() {
          return mockDate.getTime();
        }
      } as any;

      req = {
        body: {
          titel: 'Test Appointment',
          termin_datum: '2023-01-15',
          termin_zeit: '14:30'
        }
      };
      
      validateAppointment(req as Request, res as Response, next);
      
      expect(next).toHaveBeenCalled();
      expect(next).not.toHaveBeenCalledWith(expect.any(Error));
      
      // Restore original Date
      global.Date = realDate;
    });
    
    test('should reject appointment without required fields', () => {
      req = {
        body: {
          titel: 'Test Appointment'
          // Missing termin_datum and termin_zeit
        }
      };
      
      validateAppointment(req as Request, res as Response, next);
      
      expect(next).toHaveBeenCalledWith(expect.any(ValidationError));
    });

    test('should reject appointment with invalid time format', () => {
      req = {
        body: {
          titel: 'Test Appointment',
          termin_datum: '2023-01-15',
          termin_zeit: '25:30' // Invalid time
        }
      };
      
      validateAppointment(req as Request, res as Response, next);
      
      expect(next).toHaveBeenCalledWith(expect.any(ValidationError));
    });
  });

  describe('validateService', () => {
    test('should validate valid service data', () => {
      req = {
        body: {
          name: 'Test Service',
          preis_basis: '100.50',
          einheit: 'hour'
        }
      };
      
      validateService(req as Request, res as Response, next);
      
      expect(next).toHaveBeenCalled();
      expect(next).not.toHaveBeenCalledWith(expect.any(Error));
    });
    
    test('should reject service with negative price', () => {
      req = {
        body: {
          name: 'Test Service',
          preis_basis: '-10',
          einheit: 'hour'
        }
      };
      
      validateService(req as Request, res as Response, next);
      
      expect(next).toHaveBeenCalledWith(expect.any(ValidationError));
    });
  });

  describe('validateContactForm', () => {
    test('should validate valid contact form data', () => {
      req = {
        body: {
          name: 'Test Person',
          email: 'test@example.com',
          service: 'Consulting',
          message: 'This is a test message that is long enough to pass validation.'
        }
      };
      
      validateContactForm(req as Request, res as Response, next);
      
      expect(next).toHaveBeenCalled();
      expect(next).not.toHaveBeenCalledWith(expect.any(Error));
    });
    
    test('should reject contact form with short message', () => {
      req = {
        body: {
          name: 'Test Person',
          email: 'test@example.com',
          service: 'Consulting',
          message: 'Too short'
        }
      };
      
      validateContactForm(req as Request, res as Response, next);
      
      expect(next).toHaveBeenCalledWith(expect.any(ValidationError));
    });
  });
});