import { Express, Router } from 'express';
import { DiContainer } from '../core/DiContainer.js';
import { ILoggingService } from '../interfaces/ILoggingService.js';
import { AuthController } from '../controllers/AuthController.js';
import { AuthMiddleware } from '../middleware/AuthMiddleware.js';
import { IValidationService } from '../interfaces/IValidationService.js';
import { IErrorHandler } from '../interfaces/IErrorHandler.js';
import { UserController } from '../controllers/UserController.js';
import { CustomerController } from '../controllers/CustomerController.js';
import { NotificationController } from '../controllers/NotificationController.js';
import config from '../config/index.js';

// Route creators
import { createAuthRoutes } from './auth.routes.js';
import { createUserRoutes } from './users.routes.js';
import { createCustomerRoutes } from './customers.routes.js';
import { createNotificationRoutes } from './notifications.routes.js';
// import { createProjectRoutes } from './projects.routes';
// import { createAppointmentRoutes } from './appointments.routes';
// import { createServiceRoutes } from './services.routes';
// import { createRequestRoutes } from './requests.routes';
// import { createProfileRoutes } from './profile.routes';
// import { createDashboardRoutes } from './dashboard.routes';
// import { createSettingsRoutes } from './settings.routes';

export class RouteManager {
  private readonly logger: ILoggingService;
  private readonly container: DiContainer;
  private readonly apiPrefix: string;

  constructor(container: DiContainer) {
    this.container = container;
    this.logger = container.resolve<ILoggingService>('LoggingService');
    this.apiPrefix = config.API_PREFIX || '/API/v1';
  }

  registerRoutes(app: Express): void {
    // Get required dependencies from the container
    const authMiddleware = this.container.resolve<AuthMiddleware>('AuthMiddleware');
    const authController = this.container.resolve<AuthController>('AuthController');
    const userController = this.container.resolve<UserController>('UserController');
    const customerController = this.container.resolve<CustomerController>('CustomerController');
    const notificationController = this.container.resolve<NotificationController>('NotificationController');
    const validationService = this.container.resolve<IValidationService>('ValidationService');
    const errorHandler = this.container.resolve<IErrorHandler>('ErrorHandler');
    
    // Create main router
    const mainRouter = Router();

    // Register individual route groups
    const authRoutes = createAuthRoutes(authController, authMiddleware, validationService, errorHandler);
    const userRoutes = createUserRoutes(userController, authMiddleware);
    const customerRoutes = createCustomerRoutes(customerController, authMiddleware);
    const notificationRoutes = createNotificationRoutes(notificationController, authMiddleware);

    // Mount individual route groups
    mainRouter.use('/', authRoutes);
    mainRouter.use('/users', userRoutes);
    mainRouter.use('/customers', customerRoutes);
    mainRouter.use('/notifications', notificationRoutes);

    // Mount the main router with the API prefix
    app.use(this.apiPrefix, mainRouter);

    this.logger.info(`Routes registered with prefix: ${this.apiPrefix}`);
  }
}

export default RouteManager;