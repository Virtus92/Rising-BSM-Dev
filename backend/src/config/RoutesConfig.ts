/**
 * RoutesConfig
 * 
 * Configures and registers API routes for the application.
 * Maps controller methods to HTTP endpoints.
 */
import { Express, Router } from 'express';
import { ILoggingService } from '../interfaces/ILoggingService.js';
import { AuthMiddleware } from '../middleware/AuthMiddleware.js';
import { UserController } from '../controllers/UserController.js';
import { NotificationController } from '../controllers/NotificationController.js';
import { CustomerController } from '../controllers/CustomerController.js';
import { AuthController } from '../controllers/AuthController.js';

export class RoutesConfig {
  private readonly apiPrefix: string;
  
  /**
   * Creates a new RoutesConfig instance
   * 
   * @param logger - Logging service
   * @param authMiddleware - Authentication middleware
   * @param userController - User controller
   * @param notificationController - Notification controller
   * @param customerController - Customer controller
   * @param authController - Authentication controller
   */
  constructor(
    private readonly logger: ILoggingService,
    private readonly authMiddleware: AuthMiddleware,
    private readonly userController: UserController,
    private readonly notificationController: NotificationController,
    private readonly customerController: CustomerController,
    private readonly authController: AuthController
  ) {
    this.apiPrefix = process.env.API_PREFIX || '/api/v1';
    this.logger.debug('Initialized RoutesConfig');
  }

  /**
   * Register all routes
   * 
   * @param app - Express application
   */
  public registerRoutes(app: Express): void {
    this.logger.info('Registering API routes...');
    
    // Register authentication routes (not requiring auth)
    this.registerAuthRoutes(app);
    
    // Register authenticated routes
    this.registerUserRoutes(app);
    this.registerNotificationRoutes(app);
    this.registerCustomerRoutes(app);
    
    this.logger.info('API routes registered successfully');
  }

  /**
   * Register authentication routes
   * 
   * @param app - Express application
   */
  private registerAuthRoutes(app: Express): void {
    const router = Router();
    
    // Login route
    router.post('/login', this.authController.login.bind(this.authController));
    
    // Registration not requiring auth
    router.use('/auth', this.createAuthRouter());
    
    // Register router with prefix
    app.use(this.apiPrefix, router);
  }

  /**
   * Create authentication router
   * 
   * @returns Router for auth routes
   */
  private createAuthRouter(): Router {
    const router = Router();
    
    // Refresh token route
    router.post('/refresh-token', this.authController.refreshToken.bind(this.authController));
    
    // Password reset routes
    router.post('/forgot-password', this.authController.forgotPassword.bind(this.authController));
    router.get('/reset-token/:token', this.authController.validateResetToken.bind(this.authController));
    router.post('/reset-password/:token', this.authController.resetPassword.bind(this.authController));
    
    // Logout (requires auth)
    router.post('/logout', 
      this.authMiddleware.authenticate(),
      this.authController.logout.bind(this.authController)
    );
    
    // Development routes
    if (process.env.NODE_ENV === 'development') {
      router.get('/dev/reset-token', this.authController.getResetToken.bind(this.authController));
    }
    
    return router;
  }

  /**
   * Register user routes
   * 
   * @param app - Express application
   */
  private registerUserRoutes(app: Express): void {
    const router = Router();
    
    // User routes (all require authentication)
    router.use('/users', this.authMiddleware.authenticate(), this.authMiddleware.authorize(['admin']), this.createUserRouter());
    
    // Register router with prefix
    app.use(this.apiPrefix, router);
  }

  /**
   * Create user router
   * 
   * @returns Router for user routes
   */
  private createUserRouter(): Router {
    const router = Router();
    
    // GET /users - Get all users
    router.get('/', this.userController.getAllUsers.bind(this.userController));
    
    // GET /users/search - Search users
    router.get('/search', this.userController.searchUsers.bind(this.userController));
    
    // GET /users/statistics - Get user statistics
    router.get('/statistics', this.userController.getUserStatistics.bind(this.userController));
    
    // POST /users/bulk-update - Bulk update users
    router.post('/bulk-update', this.userController.bulkUpdateUsers.bind(this.userController));
    
    // GET /users/:id - Get user by ID
    router.get('/:id', this.userController.getUserById.bind(this.userController));
    
    // POST /users - Create a new user
    router.post('/', this.userController.createUser.bind(this.userController));
    
    // PUT /users/:id - Update a user
    router.put('/:id', this.userController.updateUser.bind(this.userController));
    
    // DELETE /users/:id - Delete a user
    router.delete('/:id', this.userController.deleteUser.bind(this.userController));
    
    // PATCH /users/:id/status - Update user status
    router.patch('/:id/status', this.userController.updateUserStatus.bind(this.userController));
    
    // Change password route
    router.put('/:id/password', this.userController.changePassword.bind(this.userController));
    
    return router;
  }

  /**
   * Register notification routes
   * 
   * @param app - Express application
   */
  private registerNotificationRoutes(app: Express): void {
    const router = Router();
    
    // Notification routes (all require authentication)
    router.use('/notifications', this.authMiddleware.authenticate(), this.createNotificationRouter());
    
    // Register router with prefix
    app.use(this.apiPrefix, router);
  }

  /**
   * Create notification router
   * 
   * @returns Router for notification routes
   */
  private createNotificationRouter(): Router {
    const router = Router();
    
    // GET /notifications - Get user notifications
    router.get('/', this.notificationController.getNotifications.bind(this.notificationController));
    
    // GET /notifications/stats - Get notification statistics
    router.get('/stats', this.notificationController.getNotificationStats.bind(this.notificationController));
    
    // PUT /notifications/read - Mark notifications as read
    router.put('/read', this.notificationController.markNotificationsRead.bind(this.notificationController));
    
    // DELETE /notifications/:id - Delete a notification
    router.delete('/:id', this.notificationController.deleteNotification.bind(this.notificationController));
    
    return router;
  }

  /**
   * Register customer routes
   * 
   * @param app - Express application
   */
  private registerCustomerRoutes(app: Express): void {
    const router = Router();
    
    // Customer routes (all require authentication)
    router.use('/customers', this.authMiddleware.authenticate(), this.createCustomerRouter());
    
    // Register router with prefix
    app.use(this.apiPrefix, router);
  }

  /**
   * Create customer router
   * 
   * @returns Router for customer routes
   */
  private createCustomerRouter(): Router {
    const router = Router();
    
    // GET /customers - Get all customers
    router.get('/', this.customerController.getAllCustomers.bind(this.customerController));
    
    // GET /customers/search - Search customers
    router.get('/search', this.customerController.searchCustomers.bind(this.customerController));
    
    // GET /customers/statistics - Get customer statistics
    router.get('/statistics', this.customerController.getCustomerStatistics.bind(this.customerController));
    
    // GET /customers/export - Export customers
    router.get('/export', this.customerController.exportCustomers.bind(this.customerController));
    
    // POST /customers/bulk-update - Bulk update customers
    router.post('/bulk-update', this.customerController.bulkUpdateCustomers.bind(this.customerController));
    
    // GET /customers/:id - Get customer by ID
    router.get('/:id', this.customerController.getCustomerById.bind(this.customerController));
    
    // GET /customers/:id/insights - Get customer insights
    router.get('/:id/insights', this.customerController.getCustomerInsights.bind(this.customerController));
    
    // GET /customers/:id/similar - Get similar customers
    router.get('/:id/similar', this.customerController.getSimilarCustomers.bind(this.customerController));
    
    // GET /customers/:id/history - Get customer history
    router.get('/:id/history', this.customerController.getCustomerHistory.bind(this.customerController));
    
    // POST /customers - Create a new customer
    router.post('/', this.customerController.createCustomer.bind(this.customerController));
    
    // PUT /customers/:id - Update a customer
    router.put('/:id', this.customerController.updateCustomer.bind(this.customerController));
    
    // DELETE /customers/:id - Delete a customer
    router.delete('/:id', this.customerController.deleteCustomer.bind(this.customerController));
    
    // PATCH /customers/:id/status - Update customer status
    router.patch('/:id/status', this.customerController.updateCustomerStatus.bind(this.customerController));
    
    // POST /customers/:id/notes - Add a note to customer
    router.post('/:id/notes', this.customerController.addCustomerNote.bind(this.customerController));
    
    return router;
  }
}