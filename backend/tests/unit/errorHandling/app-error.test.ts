import { 
  AppError, 
  ValidationError, 
  NotFoundError, 
  UnauthorizedError, 
  ForbiddenError 
} from '../../../src/interfaces/IErrorHandler';

describe('Error classes', () => {
  describe('AppError', () => {
    it('should create an AppError with default values', () => {
      // Arrange
      const message = 'Application error occurred';
      
      // Act
      const error = new AppError(message);
      
      // Assert
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe(message);
      expect(error.name).toBe('AppError');
      expect(error.statusCode).toBe(500);
      expect(error.errorCode).toBe('internal_error');
      expect(error.details).toBeUndefined();
      expect(error.stack).toBeDefined();
    });

    it('should create an AppError with custom values', () => {
      // Arrange
      const message = 'Custom application error';
      const statusCode = 418; // I'm a teapot
      const errorCode = 'teapot_error';
      const details = { teapot: true, size: 'large' };
      
      // Act
      const error = new AppError(message, statusCode, errorCode, details);
      
      // Assert
      expect(error.message).toBe(message);
      expect(error.statusCode).toBe(statusCode);
      expect(error.errorCode).toBe(errorCode);
      expect(error.details).toEqual(details);
    });
  });

  describe('ValidationError', () => {
    it('should create a ValidationError with default values', () => {
      // Arrange
      const message = 'Validation failed';
      
      // Act
      const error = new ValidationError(message);
      
      // Assert
      expect(error).toBeInstanceOf(AppError);
      expect(error).toBeInstanceOf(ValidationError);
      expect(error.message).toBe(message);
      expect(error.statusCode).toBe(400);
      expect(error.errorCode).toBe('validation_error');
      expect(error.errors).toEqual([]);
    });

    it('should create a ValidationError with custom validation errors', () => {
      // Arrange
      const message = 'Validation failed';
      const validationErrors = ['Name is required', 'Email is invalid'];
      
      // Act
      const error = new ValidationError(message, validationErrors);
      
      // Assert
      expect(error.message).toBe(message);
      expect(error.errors).toEqual(validationErrors);
    });
  });

  describe('NotFoundError', () => {
    it('should create a NotFoundError with default values', () => {
      // Arrange
      const message = 'Resource not found';
      
      // Act
      const error = new NotFoundError(message);
      
      // Assert
      expect(error).toBeInstanceOf(AppError);
      expect(error).toBeInstanceOf(NotFoundError);
      expect(error.message).toBe(message);
      expect(error.statusCode).toBe(404);
      expect(error.errorCode).toBe('not_found');
      expect(error.resource).toBeUndefined();
    });

    it('should create a NotFoundError with resource information', () => {
      // Arrange
      const message = 'User not found';
      const resource = 'user';
      
      // Act
      const error = new NotFoundError(message, resource);
      
      // Assert
      expect(error.message).toBe(message);
      expect(error.resource).toBe(resource);
    });
  });

  describe('UnauthorizedError', () => {
    it('should create an UnauthorizedError', () => {
      // Arrange
      const message = 'Authentication required';
      
      // Act
      const error = new UnauthorizedError(message);
      
      // Assert
      expect(error).toBeInstanceOf(AppError);
      expect(error).toBeInstanceOf(UnauthorizedError);
      expect(error.message).toBe(message);
      expect(error.statusCode).toBe(401);
      expect(error.errorCode).toBe('unauthorized');
    });
  });

  describe('ForbiddenError', () => {
    it('should create a ForbiddenError', () => {
      // Arrange
      const message = 'Access denied';
      
      // Act
      const error = new ForbiddenError(message);
      
      // Assert
      expect(error).toBeInstanceOf(AppError);
      expect(error).toBeInstanceOf(ForbiddenError);
      expect(error.message).toBe(message);
      expect(error.statusCode).toBe(403);
      expect(error.errorCode).toBe('forbidden');
    });
  });
});
