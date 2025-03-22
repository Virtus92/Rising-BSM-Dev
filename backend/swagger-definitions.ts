/**
 * @swagger
 * components:
 *   schemas:
 *     Customer:
 *       type: object
 *       required:
 *         - name
 *         - email
 *       properties:
 *         id:
 *           type: integer
 *           description: The customer ID
 *         name:
 *           type: string
 *           description: The customer name
 *         email:
 *           type: string
 *           format: email
 *           description: The customer email
 *         firma:
 *           type: string
 *           description: Company name
 *         telefon:
 *           type: string
 *           description: Phone number
 *         status:
 *           type: string
 *           enum: [aktiv, inaktiv, geloescht]
 *           description: Customer status
 *     
 *     Project:
 *       type: object
 *       required:
 *         - titel
 *         - start_datum
 *       properties:
 *         id:
 *           type: integer
 *           description: The project ID
 *         titel:
 *           type: string
 *           description: Project title
 *         kunde_id:
 *           type: integer
 *           description: Associated customer ID
 *         start_datum:
 *           type: string
 *           format: date
 *           description: Project start date
 *         status:
 *           type: string
 *           enum: [neu, in_bearbeitung, abgeschlossen, storniert]
 *           description: Project status
 *
 *     Appointment:
 *       type: object
 *       required:
 *         - titel
 *         - termin_datum
 *         - termin_zeit
 *       properties:
 *         id:
 *           type: integer
 *           description: The appointment ID
 *         titel:
 *           type: string
 *           description: Appointment title
 *         kunde_id:
 *           type: integer
 *           description: Associated customer ID
 *         termin_datum:
 *           type: string
 *           format: date
 *           description: Appointment date
 *         termin_zeit:
 *           type: string
 *           description: Appointment time (HH:MM)
 *
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *
 * tags:
 *   - name: Auth
 *     description: Authentication endpoints
 *   - name: Customers
 *     description: Customer management
 *   - name: Projects
 *     description: Project management
 *   - name: Appointments
 *     description: Appointment scheduling
 *   - name: Services
 *     description: Service management
 *   - name: Dashboard
 *     description: Dashboard statistics
 *
 * paths:
 *   /api/v1/auth/login:
 *     post:
 *       tags: [Auth]
 *       summary: Authenticate user
 *       description: Log in with email and password to receive an access token
 *       requestBody:
 *         required: true
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - email
 *                 - password
 *               properties:
 *                 email:
 *                   type: string
 *                   format: email
 *                   example: admin@example.com
 *                 password:
 *                   type: string
 *                   format: password
 *                   example: SecurePassword123
 *                 remember:
 *                   type: boolean
 *                   example: true
 *       responses:
 *         200:
 *           description: Authentication successful
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   success:
 *                     type: boolean
 *                     example: true
 *                   accessToken:
 *                     type: string
 *                     example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                   refreshToken:
 *                     type: string
 *                     example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                   expiresIn:
 *                     type: integer
 *                     example: 3600
 *                   user:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         example: 1
 *                       name:
 *                         type: string
 *                         example: Admin User
 *                       email:
 *                         type: string
 *                         example: admin@example.com
 *                       role:
 *                         type: string
 *                         example: admin
 *         401:
 *           description: Authentication failed
 *
 *   /api/v1/customers:
 *     get:
 *       tags: [Customers]
 *       summary: Get all customers
 *       description: Retrieve a list of customers with pagination and filtering options
 *       security:
 *         - bearerAuth: []
 *       parameters:
 *         - in: query
 *           name: page
 *           schema:
 *             type: integer
 *             default: 1
 *           description: Page number
 *         - in: query
 *           name: limit
 *           schema:
 *             type: integer
 *             default: 20
 *           description: Number of items per page
 *         - in: query
 *           name: status
 *           schema:
 *             type: string
 *             enum: [aktiv, inaktiv, geloescht]
 *           description: Filter by status
 *         - in: query
 *           name: search
 *           schema:
 *             type: string
 *           description: Search term for name, email, or company
 *       responses:
 *         200:
 *           description: Successful operation
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   success:
 *                     type: boolean
 *                     example: true
 *                   customers:
 *                     type: array
 *                     items:
 *                       $ref: '#/components/schemas/Customer'
 *                   pagination:
 *                     type: object
 *                     properties:
 *                       current:
 *                         type: integer
 *                         example: 1
 *                       limit:
 *                         type: integer
 *                         example: 20
 *                       total:
 *                         type: integer
 *                         example: 5
 *                       totalRecords:
 *                         type: integer
 *                         example: 100
 *         401:
 *           description: Unauthorized
 *
 *     post:
 *       tags: [Customers]
 *       summary: Create new customer
 *       description: Add a new customer to the database
 *       security:
 *         - bearerAuth: []
 *       requestBody:
 *         required: true
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Customer'
 *       responses:
 *         201:
 *           description: Customer created successfully
 *         400:
 *           description: Invalid input
 *         401:
 *           description: Unauthorized
 *
 *   /api/v1/customers/{id}:
 *     get:
 *       tags: [Customers]
 *       summary: Get customer by ID
 *       description: Retrieve detailed information for a specific customer
 *       security:
 *         - bearerAuth: []
 *       parameters:
 *         - in: path
 *           name: id
 *           required: true
 *           schema:
 *             type: integer
 *           description: Customer ID
 *       responses:
 *         200:
 *           description: Successful operation
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   success:
 *                     type: boolean
 *                     example: true
 *                   customer:
 *                     $ref: '#/components/schemas/Customer'
 *         404:
 *           description: Customer not found
 *         401:
 *           description: Unauthorized
 *
 *   /api/v1/projects:
 *     get:
 *       tags: [Projects]
 *       summary: Get all projects
 *       description: Retrieve a list of projects with pagination and filtering options
 *       security:
 *         - bearerAuth: []
 *       parameters:
 *         - in: query
 *           name: page
 *           schema:
 *             type: integer
 *           description: Page number
 *         - in: query
 *           name: limit
 *           schema:
 *             type: integer
 *           description: Items per page
 *         - in: query
 *           name: status
 *           schema:
 *             type: string
 *           description: Filter by status
 *       responses:
 *         200:
 *           description: Successful operation
 *         401:
 *           description: Unauthorized
 *
 *   /api/v1/appointments:
 *     get:
 *       tags: [Appointments]
 *       summary: Get all appointments
 *       description: Retrieve a list of appointments with pagination and filtering options
 *       security:
 *         - bearerAuth: []
 *       parameters:
 *         - in: query
 *           name: page
 *           schema:
 *             type: integer
 *           description: Page number
 *         - in: query
 *           name: limit
 *           schema:
 *             type: integer
 *           description: Items per page
 *         - in: query
 *           name: status
 *           schema:
 *             type: string
 *           description: Filter by status
 *       responses:
 *         200:
 *           description: Successful operation
 *         401:
 *           description: Unauthorized
 *
 *   /api/v1/dashboard/stats:
 *     get:
 *       tags: [Dashboard]
 *       summary: Get dashboard statistics
 *       description: Retrieve key performance metrics for the dashboard
 *       security:
 *         - bearerAuth: []
 *       responses:
 *         200:
 *           description: Successful operation
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   newRequests:
 *                     type: object
 *                     properties:
 *                       count:
 *                         type: integer
 *                       trend:
 *                         type: integer
 *                   activeProjects:
 *                     type: object
 *                     properties:
 *                       count:
 *                         type: integer
 *                       trend:
 *                         type: integer
 *                   totalCustomers:
 *                     type: object
 *                     properties:
 *                       count:
 *                         type: integer
 *                       trend:
 *                         type: integer
 *                   monthlyRevenue:
 *                     type: object
 *                     properties:
 *                       amount:
 *                         type: number
 *                       trend:
 *                         type: integer
 *         401:
 *           description: Unauthorized
 *
 *   /dev-token:
 *     get:
 *       tags: [Auth]
 *       summary: Get development JWT token
 *       description: Generates a development token for API testing (only available in development)
 *       responses:
 *         200:
 *           description: Token generated successfully
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   message:
 *                     type: string
 *                   token:
 *                     type: string
 *                   expiresIn:
 *                     type: integer
 */

// This file exists solely for Swagger documentation purposes and exports nothing
export {};