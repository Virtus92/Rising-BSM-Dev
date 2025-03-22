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
 *         name:
 *           type: string
 *           description: Customer name
 *         firma:
 *           type: string
 *           description: Company name
 *         email:
 *           type: string
 *           format: email
 *           description: Customer email address
 *         telefon:
 *           type: string
 *           description: Phone number
 *         adresse:
 *           type: string
 *           description: Street address
 *         plz:
 *           type: string
 *           description: Postal code
 *         ort:
 *           type: string
 *           description: City
 *         notizen:
 *           type: string
 *           description: Notes about the customer
 *         newsletter:
 *           type: boolean
 *           description: Newsletter subscription status
 *         status:
 *           type: string
 *           enum: [aktiv, inaktiv, geloescht]
 *           default: aktiv
 *           description: Customer status
 *         kundentyp:
 *           type: string
 *           enum: [privat, geschaeft]
 *           default: privat
 *           description: Customer type
 *
 *     Project:
 *       type: object
 *       required:
 *         - titel
 *         - start_datum
 *       properties:
 *         titel:
 *           type: string
 *           description: Project title
 *         kunde_id:
 *           type: integer
 *           description: ID of the associated customer
 *         dienstleistung_id:
 *           type: integer
 *           description: ID of the associated service
 *         start_datum:
 *           type: string
 *           format: date
 *           description: Project start date (YYYY-MM-DD)
 *         end_datum:
 *           type: string
 *           format: date
 *           description: Project end date (YYYY-MM-DD)
 *         betrag:
 *           type: number
 *           format: float
 *           description: Project amount
 *         beschreibung:
 *           type: string
 *           description: Project description
 *         status:
 *           type: string
 *           enum: [neu, in_bearbeitung, abgeschlossen, storniert]
 *           default: neu
 *           description: Project status
 *
 *     Appointment:
 *       type: object
 *       required:
 *         - titel
 *         - termin_datum
 *         - termin_zeit
 *       properties:
 *         titel:
 *           type: string
 *           description: Appointment title
 *         kunde_id:
 *           type: integer
 *           description: ID of the associated customer
 *         projekt_id:
 *           type: integer
 *           description: ID of the associated project
 *         termin_datum:
 *           type: string
 *           format: date
 *           description: Appointment date (YYYY-MM-DD)
 *         termin_zeit:
 *           type: string
 *           pattern: "^([01]\\d|2[0-3]):([0-5]\\d)$"
 *           description: Appointment time (HH:MM) in 24h format
 *         dauer:
 *           type: integer
 *           default: 60
 *           description: Duration in minutes
 *         ort:
 *           type: string
 *           description: Appointment location
 *         beschreibung:
 *           type: string
 *           description: Appointment description
 *         status:
 *           type: string
 *           enum: [geplant, bestaetigt, abgeschlossen, storniert]
 *           default: geplant
 *           description: Appointment status
 *
 *     Service:
 *       type: object
 *       required:
 *         - name
 *         - preis_basis
 *         - einheit
 *       properties:
 *         name:
 *           type: string
 *           description: Service name
 *         beschreibung:
 *           type: string
 *           description: Service description
 *         preis_basis:
 *           type: number
 *           format: float
 *           description: Base price
 *         einheit:
 *           type: string
 *           description: Unit (e.g., hour, piece)
 *         mwst_satz:
 *           type: number
 *           format: float
 *           default: 20
 *           description: VAT rate in percentage
 *         aktiv:
 *           type: boolean
 *           default: true
 *           description: Service status
 *
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         error:
 *           type: string
 *         statusCode:
 *           type: integer
 *         errors:
 *           type: array
 *           items:
 *             type: string
 *
 *     SuccessResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *         data:
 *           type: object
 *
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *
 * paths:
 *   # Authentication endpoints
 *   /api/v1/auth/login:
 *     post:
 *       tags: [Authentication]
 *       summary: Login user
 *       description: Authenticate user and get access token
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
 *                 password:
 *                   type: string
 *                   format: password
 *                 remember:
 *                   type: boolean
 *             example:
 *               email: admin@example.com
 *               password: AdminPass123!
 *               remember: true
 *       responses:
 *         200:
 *           description: Login successful
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
 *                   refreshToken:
 *                     type: string
 *                   expiresIn:
 *                     type: number
 *                   user:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       name:
 *                         type: string
 *                       email:
 *                         type: string
 *                       role:
 *                         type: string
 *         401:
 *           description: Invalid credentials
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/ErrorResponse'
 *
 *   /api/v1/auth/refresh-token:
 *     post:
 *       tags: [Authentication]
 *       summary: Refresh access token
 *       description: Get new access token using refresh token
 *       requestBody:
 *         required: true
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - refreshToken
 *               properties:
 *                 refreshToken:
 *                   type: string
 *       responses:
 *         200:
 *           description: Token refresh successful
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
 *                   refreshToken:
 *                     type: string
 *                   expiresIn:
 *                     type: number
 *         401:
 *           description: Invalid refresh token
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/ErrorResponse'
 *
 *   /api/v1/auth/forgot-password:
 *     post:
 *       tags: [Authentication]
 *       summary: Request password reset
 *       description: Send email with password reset link
 *       requestBody:
 *         required: true
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - email
 *               properties:
 *                 email:
 *                   type: string
 *                   format: email
 *       responses:
 *         200:
 *           description: Password reset instructions sent
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   success:
 *                     type: boolean
 *                     example: true
 *                   message:
 *                     type: string
 *
 *   /api/v1/auth/reset-token/{token}:
 *     get:
 *       tags: [Authentication]
 *       summary: Validate reset token
 *       description: Check if reset token is valid
 *       parameters:
 *         - in: path
 *           name: token
 *           required: true
 *           schema:
 *             type: string
 *       responses:
 *         200:
 *           description: Token is valid
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   success:
 *                     type: boolean
 *                     example: true
 *                   userId:
 *                     type: integer
 *                   email:
 *                     type: string
 *         400:
 *           description: Invalid token
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/ErrorResponse'
 *
 *   /api/v1/auth/reset-password/{token}:
 *     post:
 *       tags: [Authentication]
 *       summary: Reset password
 *       description: Set new password using reset token
 *       parameters:
 *         - in: path
 *           name: token
 *           required: true
 *           schema:
 *             type: string
 *       requestBody:
 *         required: true
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - password
 *                 - confirmPassword
 *               properties:
 *                 password:
 *                   type: string
 *                   format: password
 *                 confirmPassword:
 *                   type: string
 *                   format: password
 *       responses:
 *         200:
 *           description: Password reset successful
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   success:
 *                     type: boolean
 *                     example: true
 *                   message:
 *                     type: string
 *         400:
 *           description: Validation error
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/ErrorResponse'
 *
 *   /api/v1/auth/logout:
 *     post:
 *       tags: [Authentication]
 *       summary: Logout user
 *       description: Invalidate refresh token
 *       security:
 *         - bearerAuth: []
 *       requestBody:
 *         required: true
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 refreshToken:
 *                   type: string
 *       responses:
 *         200:
 *           description: Logout successful
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   success:
 *                     type: boolean
 *                     example: true
 *                   message:
 *                     type: string
 *
 *   # Customer endpoints
 *   /api/v1/customers:
 *     get:
 *       tags: [Customers]
 *       summary: Get all customers
 *       description: Retrieve list of customers with optional filtering
 *       security:
 *         - bearerAuth: []
 *       parameters:
 *         - in: query
 *           name: status
 *           schema:
 *             type: string
 *             enum: [aktiv, inaktiv, geloescht]
 *           description: Filter by status
 *         - in: query
 *           name: type
 *           schema:
 *             type: string
 *             enum: [privat, geschaeft]
 *           description: Filter by customer type
 *         - in: query
 *           name: search
 *           schema:
 *             type: string
 *           description: Search term for name, email or company
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
 *           description: Items per page
 *       responses:
 *         200:
 *           description: List of customers
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
 *                       type: object
 *                   pagination:
 *                     type: object
 *                     properties:
 *                       current:
 *                         type: integer
 *                       limit:
 *                         type: integer
 *                       total:
 *                         type: integer
 *                       totalRecords:
 *                         type: integer
 *                   filters:
 *                     type: object
 *         401:
 *           description: Unauthorized
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/ErrorResponse'
 *     post:
 *       tags: [Customers]
 *       summary: Create new customer
 *       description: Add a new customer
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
 *           description: Customer created
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   success:
 *                     type: boolean
 *                     example: true
 *                   customerId:
 *                     type: integer
 *                   message:
 *                     type: string
 *         400:
 *           description: Validation error
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/ErrorResponse'
 *         401:
 *           description: Unauthorized
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/ErrorResponse'
 *
 *   /api/v1/customers/{id}:
 *     get:
 *       tags: [Customers]
 *       summary: Get customer by ID
 *       description: Retrieve detailed customer information
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
 *           description: Customer details
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   success:
 *                     type: boolean
 *                     example: true
 *                   customer:
 *                     type: object
 *                   appointments:
 *                     type: array
 *                     items:
 *                       type: object
 *                   projects:
 *                     type: array
 *                     items:
 *                       type: object
 *         404:
 *           description: Customer not found
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/ErrorResponse'
 *         401:
 *           description: Unauthorized
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/ErrorResponse'
 *     put:
 *       tags: [Customers]
 *       summary: Update customer
 *       description: Update an existing customer
 *       security:
 *         - bearerAuth: []
 *       parameters:
 *         - in: path
 *           name: id
 *           required: true
 *           schema:
 *             type: integer
 *           description: Customer ID
 *       requestBody:
 *         required: true
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Customer'
 *       responses:
 *         200:
 *           description: Customer updated
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   success:
 *                     type: boolean
 *                     example: true
 *                   customerId:
 *                     type: integer
 *                   message:
 *                     type: string
 *         400:
 *           description: Validation error
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/ErrorResponse'
 *         404:
 *           description: Customer not found
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/ErrorResponse'
 *         401:
 *           description: Unauthorized
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/ErrorResponse'
 *     delete:
 *       tags: [Customers]
 *       summary: Delete customer
 *       description: Mark customer as deleted
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
 *           description: Customer deleted
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   success:
 *                     type: boolean
 *                     example: true
 *                   message:
 *                     type: string
 *         400:
 *           description: Cannot delete customer with related data
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/ErrorResponse'
 *         404:
 *           description: Customer not found
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/ErrorResponse'
 *         401:
 *           description: Unauthorized
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/ErrorResponse'
 *
 *   /api/v1/customers/{id}/notes:
 *     post:
 *       tags: [Customers]
 *       summary: Add note to customer
 *       description: Add a note to a specific customer
 *       security:
 *         - bearerAuth: []
 *       parameters:
 *         - in: path
 *           name: id
 *           required: true
 *           schema:
 *             type: integer
 *           description: Customer ID
 *       requestBody:
 *         required: true
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - notiz
 *               properties:
 *                 notiz:
 *                   type: string
 *       responses:
 *         200:
 *           description: Note added
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   success:
 *                     type: boolean
 *                     example: true
 *                   customerId:
 *                     type: integer
 *                   message:
 *                     type: string
 *         400:
 *           description: Validation error
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/ErrorResponse'
 *         404:
 *           description: Customer not found
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/ErrorResponse'
 *         401:
 *           description: Unauthorized
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/ErrorResponse'
 *
 *   /api/v1/customers/status:
 *     patch:
 *       tags: [Customers]
 *       summary: Update customer status
 *       description: Change the status of a customer
 *       security:
 *         - bearerAuth: []
 *       requestBody:
 *         required: true
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - id
 *                 - status
 *               properties:
 *                 id:
 *                   type: integer
 *                   description: Customer ID
 *                 status:
 *                   type: string
 *                   enum: [aktiv, inaktiv, geloescht]
 *       responses:
 *         200:
 *           description: Status updated
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   success:
 *                     type: boolean
 *                     example: true
 *                   customerId:
 *                     type: integer
 *                   message:
 *                     type: string
 *         400:
 *           description: Validation error
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/ErrorResponse'
 *         404:
 *           description: Customer not found
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/ErrorResponse'
 *         401:
 *           description: Unauthorized
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/ErrorResponse'
 *
 *   # Project endpoints
 *   /api/v1/projects:
 *     get:
 *       tags: [Projects]
 *       summary: Get all projects
 *       description: Retrieve list of projects with optional filtering
 *       security:
 *         - bearerAuth: []
 *       parameters:
 *         - in: query
 *           name: status
 *           schema:
 *             type: string
 *             enum: [neu, in_bearbeitung, abgeschlossen, storniert]
 *           description: Filter by status
 *         - in: query
 *           name: kunde_id
 *           schema:
 *             type: integer
 *           description: Filter by customer ID
 *         - in: query
 *           name: search
 *           schema:
 *             type: string
 *           description: Search term for project title
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
 *           description: Items per page
 *       responses:
 *         200:
 *           description: List of projects
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   success:
 *                     type: boolean
 *                     example: true
 *                   projects:
 *                     type: array
 *                     items:
 *                       type: object
 *                   pagination:
 *                     type: object
 *                     properties:
 *                       current:
 *                         type: integer
 *                       limit:
 *                         type: integer
 *                       total:
 *                         type: integer
 *                       totalRecords:
 *                         type: integer
 *                   filters:
 *                     type: object
 *         401:
 *           description: Unauthorized
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/ErrorResponse'
 *     post:
 *       tags: [Projects]
 *       summary: Create new project
 *       description: Add a new project
 *       security:
 *         - bearerAuth: []
 *       requestBody:
 *         required: true
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Project'
 *       responses:
 *         201:
 *           description: Project created
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   success:
 *                     type: boolean
 *                     example: true
 *                   projectId:
 *                     type: integer
 *                   message:
 *                     type: string
 *         400:
 *           description: Validation error
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/ErrorResponse'
 *         401:
 *           description: Unauthorized
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/ErrorResponse'
 *
 *   /api/v1/projects/{id}:
 *     get:
 *       tags: [Projects]
 *       summary: Get project by ID
 *       description: Retrieve detailed project information
 *       security:
 *         - bearerAuth: []
 *       parameters:
 *         - in: path
 *           name: id
 *           required: true
 *           schema:
 *             type: integer
 *           description: Project ID
 *       responses:
 *         200:
 *           description: Project details
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   success:
 *                     type: boolean
 *                     example: true
 *                   project:
 *                     type: object
 *                   appointments:
 *                     type: array
 *                     items:
 *                       type: object
 *                   notes:
 *                     type: array
 *                     items:
 *                       type: object
 *         404:
 *           description: Project not found
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/ErrorResponse'
 *         401:
 *           description: Unauthorized
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/ErrorResponse'
 *     put:
 *       tags: [Projects]
 *       summary: Update project
 *       description: Update an existing project
 *       security:
 *         - bearerAuth: []
 *       parameters:
 *         - in: path
 *           name: id
 *           required: true
 *           schema:
 *             type: integer
 *           description: Project ID
 *       requestBody:
 *         required: true
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Project'
 *       responses:
 *         200:
 *           description: Project updated
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   success:
 *                     type: boolean
 *                     example: true
 *                   projectId:
 *                     type: integer
 *                   message:
 *                     type: string
 *         400:
 *           description: Validation error
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/ErrorResponse'
 *         404:
 *           description: Project not found
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/ErrorResponse'
 *         401:
 *           description: Unauthorized
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/ErrorResponse'
 *
 *   /api/v1/projects/{id}/status:
 *     patch:
 *       tags: [Projects]
 *       summary: Update project status
 *       description: Change the status of a project
 *       security:
 *         - bearerAuth: []
 *       parameters:
 *         - in: path
 *           name: id
 *           required: true
 *           schema:
 *             type: integer
 *           description: Project ID
 *       requestBody:
 *         required: true
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - status
 *               properties:
 *                 status:
 *                   type: string
 *                   enum: [neu, in_bearbeitung, abgeschlossen, storniert]
 *                 note:
 *                   type: string
 *                   description: Optional note about status change
 *       responses:
 *         200:
 *           description: Status updated
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   success:
 *                     type: boolean
 *                     example: true
 *                   projectId:
 *                     type: integer
 *                   message:
 *                     type: string
 *         400:
 *           description: Validation error
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/ErrorResponse'
 *         404:
 *           description: Project not found
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/ErrorResponse'
 *         401:
 *           description: Unauthorized
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/ErrorResponse'
 *
 *   /api/v1/projects/{id}/notes:
 *     post:
 *       tags: [Projects]
 *       summary: Add note to project
 *       description: Add a note to a specific project
 *       security:
 *         - bearerAuth: []
 *       parameters:
 *         - in: path
 *           name: id
 *           required: true
 *           schema:
 *             type: integer
 *           description: Project ID
 *       requestBody:
 *         required: true
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - note
 *               properties:
 *                 note:
 *                   type: string
 *       responses:
 *         201:
 *           description: Note added
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   success:
 *                     type: boolean
 *                     example: true
 *                   projectId:
 *                     type: integer
 *                   message:
 *                     type: string
 *         400:
 *           description: Validation error
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/ErrorResponse'
 *         404:
 *           description: Project not found
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/ErrorResponse'
 *         401:
 *           description: Unauthorized
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/ErrorResponse'
 *
 *   /api/v1/projects/export:
 *     get:
 *       tags: [Projects]
 *       summary: Export projects
 *       description: Export projects data in various formats
 *       security:
 *         - bearerAuth: []
 *       parameters:
 *         - in: query
 *           name: format
 *           schema:
 *             type: string
 *             enum: [csv, xlsx, pdf, json]
 *           description: Export format
 *         - in: query
 *           name: status
 *           schema:
 *             type: string
 *           description: Filter by status
 *         - in: query
 *           name: search
 *           schema:
 *             type: string
 *           description: Search term
 *       responses:
 *         200:
 *           description: Export successful
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   success:
 *                     type: boolean
 *                     example: true
 *                   data:
 *                     type: object
 *                     description: Export data
 *         501:
 *           description: Export functionality not implemented
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   message:
 *                     type: string
 *                     example: Export functionality is being migrated to TypeScript and Prisma
 *         401:
 *           description: Unauthorized
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/ErrorResponse'
 *
 *   # Appointment endpoints
 *   /api/v1/appointments:
 *     get:
 *       tags: [Appointments]
 *       summary: Get all appointments
 *       description: Retrieve list of appointments with optional filtering
 *       security:
 *         - bearerAuth: []
 *       parameters:
 *         - in: query
 *           name: status
 *           schema:
 *             type: string
 *             enum: [geplant, bestaetigt, abgeschlossen, storniert]
 *           description: Filter by status
 *         - in: query
 *           name: date
 *           schema:
 *             type: string
 *             format: date
 *           description: Filter by date (YYYY-MM-DD)
 *         - in: query
 *           name: search
 *           schema:
 *             type: string
 *           description: Search term for appointment title or customer
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
 *           description: Items per page
 *       responses:
 *         200:
 *           description: List of appointments
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   success:
 *                     type: boolean
 *                     example: true
 *                   appointments:
 *                     type: array
 *                     items:
 *                       type: object
 *                   pagination:
 *                     type: object
 *                     properties:
 *                       current:
 *                         type: integer
 *                       limit:
 *                         type: integer
 *                       total:
 *                         type: integer
 *                       totalRecords:
 *                         type: integer
 *                   filters:
 *                     type: object
 *         401:
 *           description: Unauthorized
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/ErrorResponse'
 *     post:
 *       tags: [Appointments]
 *       summary: Create new appointment
 *       description: Add a new appointment
 *       security:
 *         - bearerAuth: []
 *       requestBody:
 *         required: true
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Appointment'
 *       responses:
 *         201:
 *           description: Appointment created
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   success:
 *                     type: boolean
 *                     example: true
 *                   appointmentId:
 *                     type: integer
 *                   message:
 *                     type: string
 *         400:
 *           description: Validation error
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/ErrorResponse'
 *         401:
 *           description: Unauthorized
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/ErrorResponse'
 *
 *   /api/v1/appointments/{id}:
 *     get:
 *       tags: [Appointments]
 *       summary: Get appointment by ID
 *       description: Retrieve detailed appointment information
 *       security:
 *         - bearerAuth: []
 *       parameters:
 *         - in: path
 *           name: id
 *           required: true
 *           schema:
 *             type: integer
 *           description: Appointment ID
 *       responses:
 *         200:
 *           description: Appointment details
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   success:
 *                     type: boolean
 *                     example: true
 *                   appointment:
 *                     type: object
 *                   notes:
 *                     type: array
 *                     items:
 *                       type: object
 *         404:
 *           description: Appointment not found
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/ErrorResponse'
 *         401:
 *           description: Unauthorized
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/ErrorResponse'
 *     put:
 *       tags: [Appointments]
 *       summary: Update appointment
 *       description: Update an existing appointment
 *       security:
 *         - bearerAuth: []
 *       parameters:
 *         - in: path
 *           name: id
 *           required: true
 *           schema:
 *             type: integer
 *           description: Appointment ID
 *       requestBody:
 *         required: true
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Appointment'
 *       responses:
 *         200:
 *           description: Appointment updated
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   success:
 *                     type: boolean
 *                     example: true
 *                   appointmentId:
 *                     type: integer
 *                   message:
 *                     type: string
 *         400:
 *           description: Validation error
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/ErrorResponse'
 *         404:
 *           description: Appointment not found
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/ErrorResponse'
 *         401:
 *           description: Unauthorized
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/ErrorResponse'
 *     delete:
 *       tags: [Appointments]
 *       summary: Delete appointment
 *       description: Delete an existing appointment
 *       security:
 *         - bearerAuth: []
 *       parameters:
 *         - in: path
 *           name: id
 *           required: true
 *           schema:
 *             type: integer
 *           description: Appointment ID
 *       responses:
 *         200:
 *           description: Appointment deleted
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   success:
 *                     type: boolean
 *                     example: true
 *                   appointmentId:
 *                     type: integer
 *                   message:
 *                     type: string
 *         404:
 *           description: Appointment not found
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/ErrorResponse'
 *         401:
 *           description: Unauthorized
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/ErrorResponse'
 *
 *   /api/v1/appointments/{id}/status:
 *     patch:
 *       tags: [Appointments]
 *       summary: Update appointment status
 *       description: Change the status of an appointment
 *       security:
 *         - bearerAuth: []
 *       parameters:
 *         - in: path
 *           name: id
 *           required: true
 *           schema:
 *             type: integer
 *           description: Appointment ID
 *       requestBody:
 *         required: true
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - status
 *               properties:
 *                 status:
 *                   type: string
 *                   enum: [geplant, bestaetigt, abgeschlossen, storniert]
 *                 note:
 *                   type: string
 *                   description: Optional note about status change
 *       responses:
 *         200:
 *           description: Status updated
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   success:
 *                     type: boolean
 *                     example: true
 *                   appointmentId:
 *                     type: integer
 *                   message:
 *                     type: string
 *         400:
 *           description: Validation error
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/ErrorResponse'
 *         404:
 *           description: Appointment not found
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/ErrorResponse'
 *         401:
 *           description: Unauthorized
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/ErrorResponse'
 *
 *   /api/v1/appointments/{id}/notes:
 *     post:
 *       tags: [Appointments]
 *       summary: Add note to appointment
 *       description: Add a note to a specific appointment
 *       security:
 *         - bearerAuth: []
 *       parameters:
 *         - in: path
 *           name: id
 *           required: true
 *           schema:
 *             type: integer
 *           description: Appointment ID
 *       requestBody:
 *         required: true
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - note
 *               properties:
 *                 note:
 *                   type: string
 *       responses:
 *         201:
 *           description: Note added
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   success:
 *                     type: boolean
 *                     example: true
 *                   appointmentId:
 *                     type: integer
 *                   message:
 *                     type: string
 *         400:
 *           description: Validation error
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/ErrorResponse'
 *         404:
 *           description: Appointment not found
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/ErrorResponse'
 *         401:
 *           description: Unauthorized
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/ErrorResponse'
 *
 *   # Service endpoints
 *   /api/v1/services:
 *     get:
 *       tags: [Services]
 *       summary: Get all services
 *       description: Retrieve list of services with optional filtering
 *       security:
 *         - bearerAuth: []
 *       parameters:
 *         - in: query
 *           name: status
 *           schema:
 *             type: string
 *             enum: [aktiv, inaktiv]
 *           description: Filter by status
 *         - in: query
 *           name: search
 *           schema:
 *             type: string
 *           description: Search term for service name or description
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
 *           description: Items per page
 *       responses:
 *         200:
 *           description: List of services
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   success:
 *                     type: boolean
 *                     example: true
 *                   services:
 *                     type: array
 *                     items:
 *                       type: object
 *                   pagination:
 *                     type: object
 *                     properties:
 *                       current:
 *                         type: integer
 *                       limit:
 *                         type: integer
 *                       total:
 *                         type: integer
 *                       totalRecords:
 *                         type: integer
 *                   filters:
 *                     type: object
 *         401:
 *           description: Unauthorized
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/ErrorResponse'
 *     post:
 *       tags: [Services]
 *       summary: Create new service
 *       description: Add a new service
 *       security:
 *         - bearerAuth: []
 *       requestBody:
 *         required: true
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Service'
 *       responses:
 *         201:
 *           description: Service created
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   success:
 *                     type: boolean
 *                     example: true
 *                   serviceId:
 *                     type: integer
 *                   message:
 *                     type: string
 *         400:
 *           description: Validation error
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/ErrorResponse'
 *         401:
 *           description: Unauthorized
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/ErrorResponse'
 *
 *   /api/v1/services/{id}:
 *     get:
 *       tags: [Services]
 *       summary: Get service by ID
 *       description: Retrieve detailed service information
 *       security:
 *         - bearerAuth: []
 *       parameters:
 *         - in: path
 *           name: id
 *           required: true
 *           schema:
 *             type: integer
 *           description: Service ID
 *       responses:
 *         200:
 *           description: Service details
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   success:
 *                     type: boolean
 *                     example: true
 *                   service:
 *                     type: object
 *         404:
 *           description: Service not found
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/ErrorResponse'
 *         401:
 *           description: Unauthorized
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/ErrorResponse'
 *     put:
 *       tags: [Services]
 *       summary: Update service
 *       description: Update an existing service
 *       security:
 *         - bearerAuth: []
 *       parameters:
 *         - in: path
 *           name: id
 *           required: true
 *           schema:
 *             type: integer
 *           description: Service ID
 *       requestBody:
 *         required: true
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Service'
 *       responses:
 *         200:
 *           description: Service updated
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   success:
 *                     type: boolean
 *                     example: true
 *                   serviceId:
 *                     type: integer
 *                   message:
 *                     type: string
 *         400:
 *           description: Validation error
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/ErrorResponse'
 *         404:
 *           description: Service not found
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/ErrorResponse'
 *         401:
 *           description: Unauthorized
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/ErrorResponse'
 * 
 *   /api/v1/services/{id}/status:
 *     patch:
 *       tags: [Services]
 *       summary: Toggle service status
 *       description: Change service active/inactive status
 *       security:
 *         - bearerAuth: []
 *       parameters:
 *         - in: path
 *           name: id
 *           required: true
 *           schema:
 *             type: integer
 *           description: Service ID
 *       requestBody:
 *         required: true
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - aktiv
 *               properties:
 *                 aktiv:
 *                   type: boolean
 *       responses:
 *         200:
 *           description: Status updated
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   success:
 *                     type: boolean
 *                     example: true
 *                   serviceId:
 *                     type: integer
 *                   message:
 *                     type: string
 *         404:
 *           description: Service not found
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/ErrorResponse'
 *         401:
 *           description: Unauthorized
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/ErrorResponse'
 *
 *   /api/v1/services/{id}/statistics:
 *     get:
 *       tags: [Services]
 *       summary: Get service statistics
 *       description: Retrieve usage statistics for a service
 *       security:
 *         - bearerAuth: []
 *       parameters:
 *         - in: path
 *           name: id
 *           required: true
 *           schema:
 *             type: integer
 *           description: Service ID
 *       responses:
 *         200:
 *           description: Service statistics
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   success:
 *                     type: boolean
 *                     example: true
 *                   statistics:
 *                     type: object
 *         404:
 *           description: Service not found
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/ErrorResponse'
 *         401:
 *           description: Unauthorized
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/ErrorResponse'
 * 
 *   # Request endpoints
 *   /api/v1/requests:
 *     get:
 *       tags: [Requests]
 *       summary: Get all contact requests
 *       description: Retrieve list of contact requests with optional filtering
 *       security:
 *         - bearerAuth: []
 *       parameters:
 *         - in: query
 *           name: status
 *           schema:
 *             type: string
 *             enum: [neu, in_bearbeitung, beantwortet, geschlossen]
 *           description: Filter by status
 *         - in: query
 *           name: service
 *           schema:
 *             type: string
 *           description: Filter by service type
 *         - in: query
 *           name: date
 *           schema:
 *             type: string
 *             format: date
 *           description: Filter by date
 *         - in: query
 *           name: search
 *           schema:
 *             type: string
 *           description: Search term for name or email
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
 *           description: Items per page
 *       responses:
 *         200:
 *           description: List of contact requests
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   success:
 *                     type: boolean
 *                     example: true
 *                   requests:
 *                     type: array
 *                     items:
 *                       type: object
 *                   pagination:
 *                     type: object
 *                     properties:
 *                       current:
 *                         type: integer
 *                       limit:
 *                         type: integer
 *                       total:
 *                         type: integer
 *                       totalRecords:
 *                         type: integer
 *                   filters:
 *                     type: object
 *         401:
 *           description: Unauthorized
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/ErrorResponse'
 * 
 *   /api/v1/requests/{id}:
 *     get:
 *       tags: [Requests]
 *       summary: Get contact request by ID
 *       description: Retrieve detailed contact request information
 *       security:
 *         - bearerAuth: []
 *       parameters:
 *         - in: path
 *           name: id
 *           required: true
 *           schema:
 *             type: integer
 *           description: Request ID
 *       responses:
 *         200:
 *           description: Request details
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   success:
 *                     type: boolean
 *                     example: true
 *                   request:
 *                     type: object
 *                   notes:
 *                     type: array
 *                     items:
 *                       type: object
 *         404:
 *           description: Request not found
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/ErrorResponse'
 *         401:
 *           description: Unauthorized
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/ErrorResponse'
 *
 *   /api/v1/requests/{id}/status:
 *     patch:
 *       tags: [Requests]
 *       summary: Update request status
 *       description: Change the status of a contact request
 *       security:
 *         - bearerAuth: []
 *       parameters:
 *         - in: path
 *           name: id
 *           required: true
 *           schema:
 *             type: integer
 *           description: Request ID
 *       requestBody:
 *         required: true
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - status
 *               properties:
 *                 status:
 *                   type: string
 *                   enum: [neu, in_bearbeitung, beantwortet, geschlossen]
 *                 note:
 *                   type: string
 *                   description: Optional note about status change
 *       responses:
 *         200:
 *           description: Status updated
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   success:
 *                     type: boolean
 *                     example: true
 *                   requestId:
 *                     type: integer
 *                   message:
 *                     type: string
 *         400:
 *           description: Validation error
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/ErrorResponse'
 *         404:
 *           description: Request not found
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/ErrorResponse'
 *         401:
 *           description: Unauthorized
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/ErrorResponse'
 * 
 * 
 *   /api/v1/requests/{id}/notes:
 *     post:
 *       tags: [Requests]
 *       summary: Add note to request
 *       description: Add a note to a specific contact request
 *       security:
 *         - bearerAuth: []
 *       parameters:
 *         - in: path
 *           name: id
 *           required: true
 *           schema:
 *             type: integer
 *           description: Request ID
 *       requestBody:
 *         required: true
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - note
 *               properties:
 *                 note:
 *                   type: string
 *       responses:
 *         201:
 *           description: Note added
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   success:
 *                     type: boolean
 *                     example: true
 *                   requestId:
 *                     type: integer
 *                   message:
 *                     type: string
 *         400:
 *           description: Validation error
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/ErrorResponse'
 *         404:
 *           description: Request not found
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/ErrorResponse'
 *         401:
 *           description: Unauthorized
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/ErrorResponse'
 *
 *   /api/v1/requests/export:
 *     get:
 *       tags: [Requests]
 *       summary: Export requests
 *       description: Export contact requests data in various formats
 *       security:
 *         - bearerAuth: []
 *       parameters:
 *         - in: query
 *           name: format
 *           schema:
 *             type: string
 *             enum: [csv, xlsx, pdf, json]
 *           description: Export format
 *         - in: query
 *           name: status
 *           schema:
 *             type: string
 *           description: Filter by status
 *         - in: query
 *           name: search
 *           schema:
 *             type: string
 *           description: Search term
 *       responses:
 *         200:
 *           description: Export successful
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   success:
 *                     type: boolean
 *                     example: true
 *                   data:
 *                     type: object
 *                     description: Export data
 *         501:
 *           description: Export functionality not implemented
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   message:
 *                     type: string
 *                     example: Export functionality is being migrated to TypeScript and Prisma
 *         401:
 *           description: Unauthorized
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/ErrorResponse'
 *
 *   # Profile endpoints
 *   /api/v1/profile:
 *     get:
 *       tags: [Profile]
 *       summary: Get user profile
 *       description: Retrieve current user profile information
 *       security:
 *         - bearerAuth: []
 *       responses:
 *         200:
 *           description: User profile data
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   user:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       name:
 *                         type: string
 *                       email:
 *                         type: string
 *                       telefon:
 *                         type: string
 *                       rolle:
 *                         type: string
 *                       profilbild:
 *                         type: string
 *                       seit:
 *                         type: string
 *                   settings:
 *                     type: object
 *                   activity:
 *                     type: array
 *                     items:
 *                       type: object
 *         401:
 *           description: Unauthorized
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/ErrorResponse'
 *     put:
 *       tags: [Profile]
 *       summary: Update user profile
 *       description: Update current user profile information
 *       security:
 *         - bearerAuth: []
 *       requestBody:
 *         required: true
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - name
 *                 - email
 *               properties:
 *                 name:
 *                   type: string
 *                 email:
 *                   type: string
 *                   format: email
 *                 telefon:
 *                   type: string
 *       responses:
 *         200:
 *           description: Profile updated
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   success:
 *                     type: boolean
 *                     example: true
 *                   user:
 *                     type: object
 *                   message:
 *                     type: string
 *         400:
 *           description: Validation error
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/ErrorResponse'
 *         401:
 *           description: Unauthorized
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/ErrorResponse'
 *
 *   /api/v1/profile/password:
 *     patch:
 *       tags: [Profile]
 *       summary: Update password
 *       description: Change user password
 *       security:
 *         - bearerAuth: []
 *       requestBody:
 *         required: true
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - current_password
 *                 - new_password
 *                 - confirm_password
 *               properties:
 *                 current_password:
 *                   type: string
 *                   format: password
 *                 new_password:
 *                   type: string
 *                   format: password
 *                 confirm_password:
 *                   type: string
 *                   format: password
 *       responses:
 *         200:
 *           description: Password updated
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   success:
 *                     type: boolean
 *                     example: true
 *                   message:
 *                     type: string
 *         400:
 *           description: Validation error
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/ErrorResponse'
 *         401:
 *           description: Unauthorized
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/ErrorResponse'
 *
 *   /api/v1/profile/picture:
 *     patch:
 *       tags: [Profile]
 *       summary: Update profile picture
 *       description: Upload and set a new profile picture
 *       security:
 *         - bearerAuth: []
 *       requestBody:
 *         required: true
 *         content:
 *           multipart/form-data:
 *             schema:
 *               type: object
 *               required:
 *                 - file
 *               properties:
 *                 file:
 *                   type: string
 *                   format: binary
 *       responses:
 *         200:
 *           description: Profile picture updated
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   success:
 *                     type: boolean
 *                     example: true
 *                   imagePath:
 *                     type: string
 *                   message:
 *                     type: string
 *         400:
 *           description: Validation error
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/ErrorResponse'
 *         401:
 *           description: Unauthorized
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/ErrorResponse'
 *
 *   /api/v1/profile/notifications:
 *     patch:
 *       tags: [Profile]
 *       summary: Update notification settings
 *       description: Update user notification preferences
 *       security:
 *         - bearerAuth: []
 *       requestBody:
 *         required: true
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 benachrichtigungen_email:
 *                   type: boolean
 *                 benachrichtigungen_push:
 *                   type: boolean
 *                 benachrichtigungen_intervall:
 *                   type: string
 *                   enum: [sofort, taeglich, woechentlich]
 *       responses:
 *         200:
 *           description: Notification settings updated
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   success:
 *                     type: boolean
 *                     example: true
 *                   message:
 *                     type: string
 *         400:
 *           description: Validation error
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/ErrorResponse'
 *         401:
 *           description: Unauthorized
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/ErrorResponse'
 *
 *   # Dashboard endpoints
 *   /api/v1/dashboard/stats:
 *     get:
 *       tags: [Dashboard]
 *       summary: Get dashboard statistics
 *       description: Retrieve key statistics for dashboard
 *       security:
 *         - bearerAuth: []
 *       responses:
 *         200:
 *           description: Dashboard statistics
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
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/ErrorResponse'
 *
 *   /api/v1/dashboard/search:
 *     get:
 *       tags: [Dashboard]
 *       summary: Global search
 *       description: Search across multiple entities
 *       security:
 *         - bearerAuth: []
 *       parameters:
 *         - in: query
 *           name: q
 *           required: true
 *           schema:
 *             type: string
 *           description: Search query
 *       responses:
 *         200:
 *           description: Search results
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   customers:
 *                     type: array
 *                     items:
 *                       type: object
 *                   projects:
 *                     type: array
 *                     items:
 *                       type: object
 *                   appointments:
 *                     type: array
 *                     items:
 *                       type: object
 *                   requests:
 *                     type: array
 *                     items:
 *                       type: object
 *                   services:
 *                     type: array
 *                     items:
 *                       type: object
 *         401:
 *           description: Unauthorized
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/ErrorResponse'
 *
 *   /api/v1/dashboard/notifications:
 *     get:
 *       tags: [Dashboard]
 *       summary: Get notifications
 *       description: Retrieve user notifications
 *       security:
 *         - bearerAuth: []
 *       responses:
 *         200:
 *           description: User notifications
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   notifications:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                         title:
 *                           type: string
 *                         message:
 *                           type: string
 *                         type:
 *                           type: string
 *                         icon:
 *                           type: string
 *                         read:
 *                           type: boolean
 *                         time:
 *                           type: string
 *                         link:
 *                           type: string
 *         401:
 *           description: Unauthorized
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/ErrorResponse'
 *
 *   /api/v1/dashboard/notifications/mark-read:
 *     post:
 *       tags: [Dashboard]
 *       summary: Mark notifications as read
 *       description: Mark one or all notifications as read
 *       security:
 *         - bearerAuth: []
 *       requestBody:
 *         required: true
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 notificationId:
 *                   type: integer
 *                   description: ID of specific notification to mark as read
 *                 markAll:
 *                   type: boolean
 *                   description: Mark all notifications as read
 *       responses:
 *         200:
 *           description: Notifications marked as read
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   success:
 *                     type: boolean
 *                     example: true
 *                   count:
 *                     type: integer
 *                   message:
 *                     type: string
 *         400:
 *           description: Validation error
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/ErrorResponse'
 *         401:
 *           description: Unauthorized
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/ErrorResponse'
 *
 *   # Settings endpoints
 *   /api/v1/settings:
 *     get:
 *       tags: [Settings]
 *       summary: Get user settings
 *       description: Retrieve settings for current user
 *       security:
 *         - bearerAuth: []
 *       responses:
 *         200:
 *           description: User settings
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   settings:
 *                     type: object
 *                     properties:
 *                       sprache:
 *                         type: string
 *                       dark_mode:
 *                         type: boolean
 *                       benachrichtigungen_email:
 *                         type: boolean
 *                       benachrichtigungen_push:
 *                         type: boolean
 *                       benachrichtigungen_intervall:
 *                         type: string
 *         401:
 *           description: Unauthorized
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/ErrorResponse'
 *     put:
 *       tags: [Settings]
 *       summary: Update user settings
 *       description: Update settings for current user
 *       security:
 *         - bearerAuth: []
 *       requestBody:
 *         required: true
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 sprache:
 *                   type: string
 *                   enum: [de, en]
 *                 dark_mode:
 *                   type: boolean
 *                 benachrichtigungen_email:
 *                   type: boolean
 *                 benachrichtigungen_push:
 *                   type: boolean
 *                 benachrichtigungen_intervall:
 *                   type: string
 *                   enum: [sofort, taeglich, woechentlich]
 *       responses:
 *         200:
 *           description: Settings updated
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   success:
 *                     type: boolean
 *                     example: true
 *                   message:
 *                     type: string
 *         400:
 *           description: Validation error
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/ErrorResponse'
 *         401:
 *           description: Unauthorized
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/ErrorResponse'
 *
 *   /api/v1/settings/system:
 *     get:
 *       tags: [Settings]
 *       summary: Get system settings
 *       description: Retrieve system settings (admin only)
 *       security:
 *         - bearerAuth: []
 *       responses:
 *         200:
 *           description: System settings
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   settings:
 *                     type: object
 *         401:
 *           description: Unauthorized
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/ErrorResponse'
 *         403:
 *           description: Forbidden - Admin access required
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/ErrorResponse'
 *     put:
 *       tags: [Settings]
 *       summary: Update system settings
 *       description: Update system settings (admin only)
 *       security:
 *         - bearerAuth: []
 *       requestBody:
 *         required: true
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 settings:
 *                   type: object
 *       responses:
 *         200:
 *           description: Settings updated
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   success:
 *                     type: boolean
 *                     example: true
 *                   message:
 *                     type: string
 *         401:
 *           description: Unauthorized
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/ErrorResponse'
 *         403:
 *           description: Forbidden - Admin access required
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/ErrorResponse'
 *
 *   /api/v1/settings/backup:
 *     get:
 *       tags: [Settings]
 *       summary: Get backup settings
 *       description: Retrieve backup settings and history (admin only)
 *       security:
 *         - bearerAuth: []
 *       responses:
 *         200:
 *           description: Backup settings and history
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   settings:
 *                     type: object
 *                     properties:
 *                       automatisch:
 *                         type: boolean
 *                       intervall:
 *                         type: string
 *                       zeit:
 *                         type: string
 *                       aufbewahrung:
 *                         type: integer
 *                       letzte_ausfuehrung:
 *                         type: string
 *                         format: date-time
 *                       status:
 *                         type: string
 *                   backups:
 *                     type: array
 *                     items:
 *                       type: object
 *         401:
 *           description: Unauthorized
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/ErrorResponse'
 *         403:
 *           description: Forbidden - Admin access required
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/ErrorResponse'
 *     put:
 *       tags: [Settings]
 *       summary: Update backup settings
 *       description: Update backup settings (admin only)
 *       security:
 *         - bearerAuth: []
 *       requestBody:
 *         required: true
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 automatisch:
 *                   type: boolean
 *                 intervall:
 *                   type: string
 *                   enum: [taeglich, woechentlich, monatlich]
 *                 zeit:
 *                   type: string
 *                   pattern: "^([01]\\d|2[0-3]):([0-5]\\d)$"
 *                 aufbewahrung:
 *                   type: integer
 *       responses:
 *         200:
 *           description: Backup settings updated
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   success:
 *                     type: boolean
 *                     example: true
 *                   message:
 *                     type: string
 *         400:
 *           description: Validation error
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/ErrorResponse'
 *         401:
 *           description: Unauthorized
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/ErrorResponse'
 *         403:
 *           description: Forbidden - Admin access required
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/ErrorResponse'
 *
 *   /api/v1/settings/backup/trigger:
 *     post:
 *       tags: [Settings]
 *       summary: Trigger manual backup
 *       description: Start a manual backup process (admin only)
 *       security:
 *         - bearerAuth: []
 *       responses:
 *         200:
 *           description: Backup process initiated
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   success:
 *                     type: boolean
 *                     example: true
 *                   message:
 *                     type: string
 *                   status:
 *                     type: string
 *         401:
 *           description: Unauthorized
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/ErrorResponse'
 *         403:
 *           description: Forbidden - Admin access required
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/ErrorResponse'
 *
 *   # Contact endpoint
 *   /api/v1/contact:
 *     post:
 *       tags: [Public]
 *       summary: Submit contact form
 *       description: Send a contact request from the public website
 *       requestBody:
 *         required: true
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - name
 *                 - email
 *                 - service
 *                 - message
 *               properties:
 *                 name:
 *                   type: string
 *                   minLength: 2
 *                   maxLength: 100
 *                 email:
 *                   type: string
 *                   format: email
 *                 phone:
 *                   type: string
 *                 service:
 *                   type: string
 *                   enum: [facility, moving, winter, other]
 *                 message:
 *                   type: string
 *                   minLength: 10
 *                   maxLength: 1000
 *       responses:
 *         201:
 *           description: Contact request submitted
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   success:
 *                     type: boolean
 *                     example: true
 *                   message:
 *                     type: string
 *                   requestId:
 *                     type: integer
 *         400:
 *           description: Validation error
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/ErrorResponse'
 *         429:
 *           description: Too many requests
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   success:
 *                     type: boolean
 *                     example: false
 *                   error:
 *                     type: string
 *
 * # Define tags
 * tags:
 *   - name: Authentication
 *     description: Authentication and user access operations
 *   - name: Customers
 *     description: Customer management
 *   - name: Projects
 *     description: Project management
 *   - name: Appointments
 *     description: Appointment scheduling and management
 *   - name: Services
 *     description: Service management
 *   - name: Requests
 *     description: Contact request management
 *   - name: Profile
 *     description: User profile management
 *   - name: Dashboard
 *     description: Dashboard related operations
 *   - name: Settings
 *     description: User and system settings
 *   - name: Public
 *     description: Public accessible endpoints
 */