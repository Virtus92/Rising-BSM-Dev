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
import { ProfileController } from '../controllers/ProfileController.js';
import { SettingsController } from '../controllers/SettingsController.js';
import { RequestController } from '../controllers/RequestController.js';
import { DashboardController } from '../controllers/DashboardController.js';
import config from '../config/index.js';

// Route creators
import { createAuthRoutes } from './auth.routes.js';
import { createUserRoutes } from './users.routes.js';
import { createCustomerRoutes } from './customers.routes.js';
import { createNotificationRoutes } from './notifications.routes.js';
import { createProfileRoutes } from './profile.routes.js';
import { createSettingsRoutes } from './settings.routes.js';
// import { createProjectRoutes } from './projects.routes';
// import { createAppointmentRoutes } from './appointments.routes';
// import { createServiceRoutes } from './services.routes';
import { createRequestRoutes } from './requests.routes.js';
import { configureDashboardRoutes } from './dashboardRoutes.js';

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
    const profileController = this.container.resolve<ProfileController>('ProfileController');
    const settingsController = this.container.resolve<SettingsController>('SettingsController');
    const requestController = this.container.resolve<RequestController>('RequestController');
    const dashboardController = this.container.resolve<DashboardController>('DashboardController');
    const validationService = this.container.resolve<IValidationService>('ValidationService');
    const errorHandler = this.container.resolve<IErrorHandler>('ErrorHandler');
    
    // Create main router
    const mainRouter = Router();

    // Register individual route groups
    const authRoutes = createAuthRoutes(authController, authMiddleware, validationService, errorHandler);
    const userRoutes = createUserRoutes(userController, authMiddleware, validationService, errorHandler);
    const customerRoutes = createCustomerRoutes(customerController, authMiddleware, validationService, errorHandler);
    const notificationRoutes = createNotificationRoutes(notificationController, authMiddleware, validationService, errorHandler);
    const profileRoutes = createProfileRoutes(profileController, authMiddleware, validationService, errorHandler);
    const settingsRoutes = createSettingsRoutes(settingsController, authMiddleware, validationService, errorHandler);
    const requestRoutes = createRequestRoutes(requestController, authMiddleware, validationService, errorHandler);
    const dashboardRoutes = configureDashboardRoutes(dashboardController, authMiddleware);

    // Mount individual route groups
    mainRouter.use('/', authRoutes);
    mainRouter.use('/users', userRoutes);
    mainRouter.use('/customers', customerRoutes);
    mainRouter.use('/notifications', notificationRoutes);
    mainRouter.use('/profile', profileRoutes);
    mainRouter.use('/settings', settingsRoutes);
    // Fix: Register a special route for the public request submission endpoint
    // This is needed to match the OpenAPI definition
    mainRouter.post('/requests/public', (req, res) => requestController.submitRequest(req, res));
    mainRouter.use('/requests', requestRoutes);
    mainRouter.use('/dashboard', dashboardRoutes);

    // Mount the main router with the API prefix
    app.use(this.apiPrefix, mainRouter);

    this.logger.info(`Routes registered with prefix: ${this.apiPrefix}`);
  }
}

export default RouteManager;