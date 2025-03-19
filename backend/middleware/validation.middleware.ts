/**
 * Validation middleware for input data
 */
import { Request, Response, NextFunction } from 'express';
import { validateInput, validateDate, validateEmail, validatePhone, ValidationSchema } from '../utils/validators';
import { ValidationError } from '../utils/errors';

/**
 * Validates customer data
 */
export const validateCustomer = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const { name, email, firma, telefon, adresse, plz, ort, notizen, newsletter, status, kundentyp } = req.body;
    
    // Validation schema
    const validationSchema: ValidationSchema = {
      name: { type: 'text', required: true, minLength: 2 },
      email: { type: 'email', required: true },
      firma: { type: 'text', required: false },
      telefon: { type: 'phone', required: false },
      adresse: { type: 'text', required: false },
      plz: { type: 'text', required: false },
      ort: { type: 'text', required: false },
      notizen: { type: 'text', required: false },
      newsletter: { type: 'text', required: false },
      status: { type: 'text', required: false },
      kundentyp: { type: 'text', required: false }
    };

    const { isValid, errors } = validateInput(
      req.body, 
      validationSchema
    );
    
    // If there are validation errors
    if (!isValid) {
      throw new ValidationError('Validation failed: ' + errors.join('. '), errors);
    }
    
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Validates project data
 */
export const validateProject = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const { titel, start_datum, end_datum } = req.body;
    const errors: string[] = [];
    
    // Required fields
    if (!titel || typeof titel !== 'string' || titel.trim() === '') {
      errors.push('Title is required');
    }
    
    if (!start_datum) {
      errors.push('Start date is required');
    } else {
      const dateValidation = validateDate(start_datum);
      if (!dateValidation.isValid) {
        errors.push('Please enter a valid start date');
      }
    }
    
    // Optional end date should be after start date
    if (end_datum && start_datum) {
      const startDateValidation = validateDate(start_datum);
      const endDateValidation = validateDate(end_datum);
      
      if (startDateValidation.isValid && endDateValidation.isValid) {
        const startDate = new Date(start_datum);
        const endDate = new Date(end_datum);
        
        if (endDate < startDate) {
          errors.push('End date must be after start date');
        }
      }
    }
    
    // If there are validation errors
    if (errors.length > 0) {
      throw new ValidationError('Validation failed: ' + errors.join('. '), errors);
    }
    
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Validates appointment data
 */
export const validateAppointment = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const { titel, termin_datum, termin_zeit } = req.body;
    const errors: string[] = [];
    
    // Required fields
    if (!titel || typeof titel !== 'string' || titel.trim() === '') {
      errors.push('Title is required');
    }
    
    if (!termin_datum) {
      errors.push('Date is required');
    } else {
      const dateValidation = validateDate(termin_datum);
      if (!dateValidation.isValid) {
        errors.push('Please enter a valid date');
      }
    }
    
    if (!termin_zeit) {
      errors.push('Time is required');
    } else if (!/^([01]\d|2[0-3]):([0-5]\d)$/.test(termin_zeit)) {
      errors.push('Please enter a valid time (HH:MM)');
    }
    
    // Validate the date is not in the past
    if (termin_datum && termin_zeit) {
      try {
        const now = new Date();
        const appointmentDate = new Date(`${termin_datum}T${termin_zeit}`);
        if (appointmentDate < now) {
          errors.push('Appointment date and time cannot be in the past');
        }
      } catch (e) {
        errors.push('Invalid appointment date or time format');
      }
    }
    
    // If there are validation errors
    if (errors.length > 0) {
      throw new ValidationError('Validation failed: ' + errors.join('. '), errors);
    }
    
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Validates service data
 */
export const validateService = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const { name, preis_basis, einheit } = req.body;
    const errors: string[] = [];
    
    // Required fields
    if (!name || typeof name !== 'string' || name.trim() === '') {
      errors.push('Name is required');
    }
    
    if (!preis_basis) {
      errors.push('Base price is required');
    } else if (isNaN(parseFloat(preis_basis)) || parseFloat(preis_basis) < 0) {
      errors.push('Please enter a valid price (must be a positive number)');
    }
    
    if (!einheit || typeof einheit !== 'string' || einheit.trim() === '') {
      errors.push('Unit is required');
    }
    
    // If there are validation errors
    if (errors.length > 0) {
      throw new ValidationError('Validation failed: ' + errors.join('. '), errors);
    }
    
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Validates request status update
 */
export const validateStatusUpdate = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const { id, status } = req.body;
    const errors: string[] = [];
    
    // Required fields
    if (!id) {
      errors.push('ID is required');
    }
    
    if (!status || typeof status !== 'string') {
      errors.push('Status is required');
    }
    
    // If there are validation errors
    if (errors.length > 0) {
      throw new ValidationError('Validation failed: ' + errors.join('. '), errors);
    }
    
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Validates contact form submission
 */
export const validateContactForm = (req: Request, res: Response, next: NextFunction): void => {
  try {
    // Validation schema for contact form
    const validationSchema: ValidationSchema = {
      name: {
        type: 'text',
        required: true,
        minLength: 2,
        maxLength: 100,
      },
      email: {
        type: 'email',
      },
      phone: {
        type: 'phone',
        required: false,
      },
      service: {
        type: 'text',
        required: true,
      },
      message: {
        type: 'text',
        required: true,
        minLength: 10,
        maxLength: 1000,
      },
    };

    // Validate input
    const validationResult = validateInput(req.body, validationSchema);

    if (!validationResult.isValid) {
      throw new ValidationError('Validation failed', validationResult.errors);
    }
    
    next();
  } catch (error) {
    next(error);
  }
};

export default {
  validateCustomer,
  validateProject,
  validateAppointment,
  validateService,
  validateStatusUpdate,
  validateContactForm
};