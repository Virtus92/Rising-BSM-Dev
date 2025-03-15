const validationMiddleware = require('../../middleware/validation.middleware');

describe('Validation Middleware', () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    req = { body: {} };
    res = {};
    next = jest.fn();
  });

  describe('validateCustomer', () => {
    it('should validate customer with required fields', () => {
      req.body = {
        name: 'John Doe',
        email: 'john@example.com'
      };

      validationMiddleware.validateCustomer(req, res, next);
      expect(next).toHaveBeenCalledTimes(1);
      expect(next).toHaveBeenCalledWith();
    });

    it('should sanitize customer data', () => {
      req.body = {
        name: ' John Doe ',
        email: ' JOHN@EXAMPLE.COM ',
        firma: ' Acme Inc. ',
        adresse: ' 123 Main St ',
        ort: ' Berlin ',
        notizen: ' Some notes '
      };

      validationMiddleware.validateCustomer(req, res, next);
      expect(req.body.name).not.toEqual(' John Doe ');
      expect(req.body.email).not.toEqual(' JOHN@EXAMPLE.COM ');
      expect(next).toHaveBeenCalled();
    });

    it('should throw error for missing name and email', () => {
      req.body = {};

      validationMiddleware.validateCustomer(req, res, next);
      expect(next).toHaveBeenCalledTimes(1);
      expect(next.mock.calls[0][0]).toBeInstanceOf(Error);
      expect(next.mock.calls[0][0].statusCode).toBe(400);
    });

    it('should throw error for invalid email format', () => {
      req.body = {
        name: 'John Doe',
        email: 'invalid-email'
      };

      validationMiddleware.validateCustomer(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
      expect(next.mock.calls[0][0].statusCode).toBe(400);
    });
  });

  describe('validateProject', () => {
    it('should validate project with required fields', () => {
      req.body = {
        titel: 'Project X',
        start_datum: '2023-05-01'
      };

      validationMiddleware.validateProject(req, res, next);
      expect(next).toHaveBeenCalledWith();
    });

    it('should throw error when end date is before start date', () => {
      req.body = {
        titel: 'Project X',
        start_datum: '2023-05-01',
        end_datum: '2023-04-01'
      };

      validationMiddleware.validateProject(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
      expect(next.mock.calls[0][0].statusCode).toBe(400);
    });
  });

  describe('validateAppointment', () => {
    beforeEach(() => {
      // Mock Date to ensure consistent behavior for appointment date validation
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2023-01-01'));
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should validate appointment with valid data', () => {
      req.body = {
        titel: 'Meeting',
        termin_datum: '2023-12-31',
        termin_zeit: '14:30'
      };

      validationMiddleware.validateAppointment(req, res, next);
      expect(next).toHaveBeenCalledWith();
    });

    it('should throw error for invalid time format', () => {
      req.body = {
        titel: 'Meeting',
        termin_datum: '2023-12-31',
        termin_zeit: '25:70'
      };

      validationMiddleware.validateAppointment(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('validateService', () => {
    it('should validate service with valid data', () => {
      req.body = {
        name: 'Service A',
        preis_basis: '100.00',
        einheit: 'hour'
      };

      validationMiddleware.validateService(req, res, next);
      expect(next).toHaveBeenCalledWith();
    });

    it('should throw error for negative price', () => {
      req.body = {
        name: 'Service A',
        preis_basis: '-50.00',
        einheit: 'hour'
      };

      validationMiddleware.validateService(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('validateStatusUpdate', () => {
    it('should validate status update with valid data', () => {
      req.body = {
        id: 123,
        status: 'completed'
      };

      validationMiddleware.validateStatusUpdate(req, res, next);
      expect(next).toHaveBeenCalledWith();
    });

    it('should throw error for missing id', () => {
      req.body = {
        status: 'completed'
      };

      validationMiddleware.validateStatusUpdate(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });
});
