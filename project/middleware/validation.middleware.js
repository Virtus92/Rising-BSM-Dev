 /**
 * Validation middleware for input data
 */
const validator = require('validator');

/**
 * Validates customer data
 */
exports.validateCustomer = (req, res, next) => {
  try {
    const { name, email } = req.body;
    const errors = [];
    
    // Required fields
    if (!name || typeof name !== 'string' || name.trim() === '') {
      errors.push('Name is required');
    }
    
    if (!email || typeof email !== 'string' || email.trim() === '') {
      errors.push('Email is required');
    } else if (!validator.isEmail(email)) {
      errors.push('Please enter a valid email address');
    }
    
    // Optional fields validation
    if (req.body.telefon && !validator.isMobilePhone(req.body.telefon, 'any', { strictMode: false })) {
      errors.push('Please enter a valid phone number');
    }
    
    if (req.body.plz && !validator.isPostalCode(req.body.plz, 'any')) {
      errors.push('Please enter a valid postal code');
    }
    
    // If there are validation errors
    if (errors.length > 0) {
      const error = new Error(errors.join('. '));
      error.statusCode = 400;
      error.validationErrors = errors;
      throw error;
    }
    
    // Sanitize inputs
    req.body.name = validator.escape(req.body.name.trim());
    req.body.email = validator.normalizeEmail(email.trim());
    
    if (req.body.firma) {
      req.body.firma = validator.escape(req.body.firma.trim());
    }
    
    if (req.body.adresse) {
      req.body.adresse = validator.escape(req.body.adresse.trim());
    }
    
    if (req.body.ort) {
      req.body.ort = validator.escape(req.body.ort.trim());
    }
    
    if (req.body.notizen) {
      req.body.notizen = validator.escape(req.body.notizen.trim());
    }
    
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Validates project data
 */
exports.validateProject = (req, res, next) => {
  try {
    const { titel, start_datum } = req.body;
    const errors = [];
    
    // Required fields
    if (!titel || typeof titel !== 'string' || titel.trim() === '') {
      errors.push('Title is required');
    }
    
    if (!start_datum) {
      errors.push('Start date is required');
    } else if (!validator.isDate(start_datum)) {
      errors.push('Please enter a valid start date');
    }
    
    // Optional end date should be after start date
    if (req.body.end_datum && validator.isDate(req.body.end_datum)) {
      const startDate = new Date(start_datum);
      const endDate = new Date(req.body.end_datum);
      
      if (endDate < startDate) {
        errors.push('End date must be after start date');
      }
    }
    
    // If there are validation errors
    if (errors.length > 0) {
      const error = new Error(errors.join('. '));
      error.statusCode = 400;
      error.validationErrors = errors;
      throw error;
    }
    
    // Sanitize inputs
    req.body.titel = validator.escape(req.body.titel.trim());
    
    if (req.body.beschreibung) {
      req.body.beschreibung = validator.escape(req.body.beschreibung.trim());
    }
    
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Validates appointment data
 */
exports.validateAppointment = (req, res, next) => {
  try {
    const { titel, termin_datum, termin_zeit } = req.body;
    const errors = [];
    
    // Required fields
    if (!titel || typeof titel !== 'string' || titel.trim() === '') {
      errors.push('Title is required');
    }
    
    if (!termin_datum) {
      errors.push('Date is required');
    } else if (!validator.isDate(termin_datum)) {
      errors.push('Please enter a valid date');
    }
    
    if (!termin_zeit) {
      errors.push('Time is required');
    } else if (!validator.matches(termin_zeit, /^([01]\d|2[0-3]):([0-5]\d)$/)) {
      errors.push('Please enter a valid time (HH:MM)');
    }
    
    // Validate the date is not in the past
    const appointmentDate = new Date(`${termin_datum}T${termin_zeit}`);
    if (appointmentDate < new Date()) {
      errors.push('Appointment date and time cannot be in the past');
    }
    
    // If there are validation errors
    if (errors.length > 0) {
      const error = new Error(errors.join('. '));
      error.statusCode = 400;
      error.validationErrors = errors;
      throw error;
    }
    
    // Sanitize inputs
    req.body.titel = validator.escape(req.body.titel.trim());
    
    if (req.body.ort) {
      req.body.ort = validator.escape(req.body.ort.trim());
    }
    
    if (req.body.beschreibung) {
      req.body.beschreibung = validator.escape(req.body.beschreibung.trim());
    }
    
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Validates service data
 */
exports.validateService = (req, res, next) => {
  try {
    const { name, preis_basis, einheit } = req.body;
    const errors = [];
    
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
      const error = new Error(errors.join('. '));
      error.statusCode = 400;
      error.validationErrors = errors;
      throw error;
    }
    
    // Sanitize inputs
    req.body.name = validator.escape(req.body.name.trim());
    req.body.einheit = validator.escape(req.body.einheit.trim());
    
    if (req.body.beschreibung) {
      req.body.beschreibung = validator.escape(req.body.beschreibung.trim());
    }
    
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Validates request status update
 */
exports.validateStatusUpdate = (req, res, next) => {
  try {
    const { id, status } = req.body;
    const errors = [];
    
    // Required fields
    if (!id) {
      errors.push('ID is required');
    }
    
    if (!status || typeof status !== 'string') {
      errors.push('Status is required');
    }
    
    // If there are validation errors
    if (errors.length > 0) {
      const error = new Error(errors.join('. '));
      error.statusCode = 400;
      error.validationErrors = errors;
      throw error;
    }
    
    next();
  } catch (error) {
    next(error);
  }
};