/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - name
 *         - email
 *         - password
 *       properties:
 *         id:
 *           type: integer
 *           description: User ID (auto-generated)
 *         name:
 *           type: string
 *           description: Full name of the user
 *         email:
 *           type: string
 *           format: email
 *           description: Email address (must be unique)
 *         password:
 *           type: string
 *           format: password
 *           description: Password (min 8 characters, stored encrypted)
 *         role:
 *           type: string
 *           enum: [admin, manager, employee]
 *           default: employee
 *           description: User role determining access permissions
 *         phone:
 *           type: string
 *           description: Phone number
 *         status:
 *           type: string
 *           enum: [active, inactive, blocked]
 *           default: active
 *           description: User account status
 *         profilePicture:
 *           type: string
 *           description: Path to profile picture
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp of user creation
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp of last update
 *
 *     UserSettings:
 *       type: object
 *       properties:
 *         language:
 *           type: string
 *           enum: [de, en]
 *           default: en
 *           description: User interface language preference
 *         darkMode:
 *           type: boolean
 *           default: false
 *           description: Dark mode enabled/disabled
 *         emailNotifications:
 *           type: boolean
 *           default: true
 *           description: Email notifications enabled/disabled
 *         pushNotifications:
 *           type: boolean
 *           default: false
 *           description: Push notifications enabled/disabled
 *         notificationInterval:
 *           type: string
 *           enum: [immediate, daily, weekly]
 *           default: immediate
 *           description: Notification delivery interval
 *
 *     Customer:
 *       type: object
 *       required:
 *         - name
 *         - email
 *       properties:
 *         id:
 *           type: integer
 *           description: Customer ID (auto-generated)
 *         name:
 *           type: string
 *           description: Customer name
 *         company:
 *           type: string
 *           description: Company name
 *         email:
 *           type: string
 *           format: email
 *           description: Customer email address
 *         phone:
 *           type: string
 *           description: Phone number
 *         address:
 *           type: string
 *           description: Street address
 *         postalCode:
 *           type: string
 *           description: Postal code
 *         city:
 *           type: string
 *           description: City
 *         notes:
 *           type: string
 *           description: Notes about the customer
 *         newsletter:
 *           type: boolean
 *           description: Newsletter subscription status
 *         status:
 *           type: string
 *           enum: [active, inactive, deleted]
 *           default: active
 *           description: Customer status
 *         type:
 *           type: string
 *           enum: [private, business]
 *           default: private
 *           description: Customer type
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp of customer creation
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp of last update
 *
 *     Project:
 *       type: object
 *       required:
 *         - title
 *         - startDate
 *       properties:
 *         id:
 *           type: integer
 *           description: Project ID (auto-generated)
 *         title:
 *           type: string
 *           description: Project title
 *         customerId:
 *           type: integer
 *           description: ID of the associated customer
 *         serviceId:
 *           type: integer
 *           description: ID of the associated service
 *         startDate:
 *           type: string
 *           format: date
 *           description: Project start date (YYYY-MM-DD)
 *         endDate:
 *           type: string
 *           format: date
 *           description: Project end date (YYYY-MM-DD)
 *         amount:
 *           type: number
 *           format: float
 *           description: Project amount
 *         description:
 *           type: string
 *           description: Project description
 *         status:
 *           type: string
 *           enum: [new, in_progress, completed, canceled]
 *           default: new
 *           description: Project status
 *         createdBy:
 *           type: integer
 *           description: ID of the user who created the project
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp of project creation
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp of last update
 *
 *     ProjectNote:
 *       type: object
 *       required:
 *         - projectId
 *         - text
 *       properties:
 *         id:
 *           type: integer
 *           description: Note ID (auto-generated)
 *         projectId:
 *           type: integer
 *           description: ID of the associated project
 *         userId:
 *           type: integer
 *           description: ID of the user who created the note
 *         userName:
 *           type: string
 *           description: Name of the user who created the note
 *         text:
 *           type: string
 *           description: Note content
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp of note creation
 *
 *     Appointment:
 *       type: object
 *       required:
 *         - title
 *         - appointmentDate
 *       properties:
 *         id:
 *           type: integer
 *           description: Appointment ID (auto-generated)
 *         title:
 *           type: string
 *           description: Appointment title
 *         customerId:
 *           type: integer
 *           description: ID of the associated customer
 *         projectId:
 *           type: integer
 *           description: ID of the associated project
 *         appointmentDate:
 *           type: string
 *           format: date-time
 *           description: Appointment date and time
 *         duration:
 *           type: integer
 *           default: 60
 *           description: Duration in minutes
 *         location:
 *           type: string
 *           description: Appointment location
 *         description:
 *           type: string
 *           description: Appointment description
 *         status:
 *           type: string
 *           enum: [planned, confirmed, completed, canceled]
 *           default: planned
 *           description: Appointment status
 *         createdBy:
 *           type: integer
 *           description: ID of the user who created the appointment
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp of appointment creation
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp of last update
 *
 *     AppointmentNote:
 *       type: object
 *       required:
 *         - appointmentId
 *         - text
 *       properties:
 *         id:
 *           type: integer
 *           description: Note ID (auto-generated)
 *         appointmentId:
 *           type: integer
 *           description: ID of the associated appointment
 *         userId:
 *           type: integer
 *           description: ID of the user who created the note
 *         userName:
 *           type: string
 *           description: Name of the user who created the note
 *         text:
 *           type: string
 *           description: Note content
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp of note creation
 *
 *     Service:
 *       type: object
 *       required:
 *         - name
 *         - priceBase
 *         - unit
 *       properties:
 *         id:
 *           type: integer
 *           description: Service ID (auto-generated)
 *         name:
 *           type: string
 *           description: Service name
 *         description:
 *           type: string
 *           description: Service description
 *         priceBase:
 *           type: number
 *           format: float
 *           description: Base price
 *         unit:
 *           type: string
 *           description: Unit (e.g., hour, piece)
 *         vatRate:
 *           type: number
 *           format: float
 *           default: 20
 *           description: VAT rate in percentage
 *         active:
 *           type: boolean
 *           default: true
 *           description: Service status
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp of service creation
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp of last update
 *
 *     ContactRequest:
 *       type: object
 *       required:
 *         - name
 *         - email
 *         - service
 *         - message
 *       properties:
 *         id:
 *           type: integer
 *           description: Request ID (auto-generated)
 *         name:
 *           type: string
 *           description: Contact name
 *         email:
 *           type: string
 *           format: email
 *           description: Contact email
 *         phone:
 *           type: string
 *           description: Contact phone number
 *         service:
 *           type: string
 *           enum: [facility, moving, winter, other]
 *           description: Requested service type
 *         message:
 *           type: string
 *           description: Request message
 *         status:
 *           type: string
 *           enum: [new, in_progress, answered, closed]
 *           default: new
 *           description: Request status
 *         processorId:
 *           type: integer
 *           description: ID of the user processing the request
 *         ipAddress:
 *           type: string
 *           description: IP address of submitter
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp of request creation
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp of last update
 *
 *     RequestNote:
 *       type: object
 *       required:
 *         - requestId
 *         - text
 *       properties:
 *         id:
 *           type: integer
 *           description: Note ID (auto-generated)
 *         requestId:
 *           type: integer
 *           description: ID of the associated request
 *         userId:
 *           type: integer
 *           description: ID of the user who created the note
 *         userName:
 *           type: string
 *           description: Name of the user who created the note
 *         text:
 *           type: string
 *           description: Note content
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp of note creation
 *
 *     Notification:
 *       type: object
 *       required:
 *         - type
 *         - title
 *       properties:
 *         id:
 *           type: integer
 *           description: Notification ID (auto-generated)
 *         userId:
 *           type: integer
 *           description: ID of the user receiving the notification
 *         type:
 *           type: string
 *           enum: [request, appointment, project, warning, system]
 *           description: Notification type
 *         title:
 *           type: string
 *           description: Notification title
 *         message:
 *           type: string
 *           description: Notification message
 *         referenceId:
 *           type: integer
 *           description: ID of the referenced entity
 *         referenceType:
 *           type: string
 *           description: Type of the referenced entity
 *         read:
 *           type: boolean
 *           default: false
 *           description: Whether the notification has been read
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp of notification creation
 *
 *     Invoice:
 *       type: object
 *       required:
 *         - invoiceNumber
 *         - customerId
 *         - amount
 *         - invoiceDate
 *         - dueDate
 *       properties:
 *         id:
 *           type: integer
 *           description: Invoice ID (auto-generated)
 *         invoiceNumber:
 *           type: string
 *           description: Invoice number
 *         projectId:
 *           type: integer
 *           description: Associated project ID
 *         customerId:
 *           type: integer
 *           description: Customer ID
 *         amount:
 *           type: number
 *           format: float
 *           description: Net amount
 *         vatAmount:
 *           type: number
 *           format: float
 *           description: VAT amount
 *         totalAmount:
 *           type: number
 *           format: float
 *           description: Total amount including VAT
 *         invoiceDate:
 *           type: string
 *           format: date
 *           description: Invoice date
 *         dueDate:
 *           type: string
 *           format: date
 *           description: Due date
 *         paidAt:
 *           type: string
 *           format: date-time
 *           description: Payment date
 *         status:
 *           type: string
 *           enum: [draft, sent, paid, overdue, canceled]
 *           default: draft
 *           description: Invoice status
 *
 *     InvoicePosition:
 *       type: object
 *       required:
 *         - invoiceId
 *         - serviceId
 *         - quantity
 *         - unitPrice
 *       properties:
 *         id:
 *           type: integer
 *           description: Position ID (auto-generated)
 *         invoiceId:
 *           type: integer
 *           description: Associated invoice ID
 *         serviceId:
 *           type: integer
 *           description: Service ID
 *         quantity:
 *           type: integer
 *           description: Quantity
 *         unitPrice:
 *           type: number
 *           format: float
 *           description: Unit price
 *         
 *     PaginationResult:
 *       type: object
 *       properties:
 *         current:
 *           type: integer
 *           description: Current page number
 *         limit:
 *           type: integer
 *           description: Items per page
 *         total:
 *           type: integer
 *           description: Total number of pages
 *         totalRecords:
 *           type: integer
 *           description: Total number of records
 *
 *     MetaData:
 *       type: object
 *       properties:
 *         pagination:
 *           $ref: '#/components/schemas/PaginationResult'
 *         timestamp:
 *           type: string
 *           format: date-time
 *           description: Response timestamp
 *
 *     StandardResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           description: Whether the operation was successful
 *         data:
 *           type: object
 *           description: Response data
 *         message:
 *           type: string
 *           description: Response message
 *         meta:
 *           $ref: '#/components/schemas/MetaData'
 *
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         error:
 *           type: string
 *           description: Error message
 *         statusCode:
 *           type: integer
 *           description: HTTP status code
 *         errors:
 *           type: array
 *           items:
 *             type: string
 *           description: List of specific error messages
 *         details:
 *           type: object
 *           description: Additional error details
 *
 *     Tokens:
 *       type: object
 *       properties:
 *         accessToken:
 *           type: string
 *           description: JWT access token
 *         refreshToken:
 *           type: string
 *           description: JWT refresh token
 *         expiresIn:
 *           type: integer
 *           description: Token expiration time in seconds
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
 *       operationId: login
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
 *       operationId: refreshToken
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
 *       operationId: forgotPassword
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
 *       operationId: validateResetToken
 *       parameters:
 *         - in: path
 *           name: token
 *           required: true
 *           schema:
 *             type: string
 *           description: Reset token
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
 *       operationId: resetPassword
 *       parameters:
 *         - in: path
 *           name: token
 *           required: true
 *           schema:
 *             type: string
 *           description: Reset token
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
 *                   minLength: 8
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
 *       operationId: logout
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
 *       operationId: getAllCustomers
 *       security:
 *         - bearerAuth: []
 *       parameters:
 *         - in: query
 *           name: status
 *           schema:
 *             type: string
 *             enum: [active, inactive, deleted]
 *           description: Filter by status
 *         - in: query
 *           name: type
 *           schema:
 *             type: string
 *             enum: [private, business]
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
 *                       $ref: '#/components/schemas/Customer'
 *                   pagination:
 *                     $ref: '#/components/schemas/PaginationResult'
 *                   filters:
 *                     type: object
 *                     properties:
 *                       status:
 *                         type: string
 *                       type:
 *                         type: string
 *                       search:
 *                         type: string
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
 *       operationId: createCustomer
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
 *                   minLength: 2
 *                   description: Customer name
 *                 company:
 *                   type: string
 *                   description: Company name
 *                 email:
 *                   type: string
 *                   format: email
 *                   description: Customer email address
 *                 phone:
 *                   type: string
 *                   description: Phone number
 *                 address:
 *                   type: string
 *                   description: Street address
 *                 postalCode:
 *                   type: string
 *                   description: Postal code
 *                 city:
 *                   type: string
 *                   description: City
 *                 notes:
 *                   type: string
 *                   description: Notes about the customer
 *                 newsletter:
 *                   type: boolean
 *                   description: Newsletter subscription status
 *                 status:
 *                   type: string
 *                   enum: [active, inactive, deleted]
 *                   description: Customer status
 *                 type:
 *                   type: string
 *                   enum: [private, business]
 *                   description: Customer type
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
 *       operationId: getCustomerById
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
 *                     $ref: '#/components/schemas/Customer'
 *                   appointments:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                         title:
 *                           type: string
 *                         date:
 *                           type: string
 *                         status:
 *                           type: string
 *                         statusLabel:
 *                           type: string
 *                         statusClass:
 *                           type: string
 *                   projects:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                         title:
 *                           type: string
 *                         date:
 *                           type: string
 *                         status:
 *                           type: string
 *                         statusLabel:
 *                           type: string
 *                         statusClass:
 *                           type: string
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
 *       operationId: updateCustomer
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
 *                 - name
 *                 - email
 *               properties:
 *                 name:
 *                   type: string
 *                   minLength: 2
 *                   description: Customer name
 *                 company:
 *                   type: string
 *                   description: Company name
 *                 email:
 *                   type: string
 *                   format: email
 *                   description: Customer email address
 *                 phone:
 *                   type: string
 *                   description: Phone number
 *                 address:
 *                   type: string
 *                   description: Street address
 *                 postalCode:
 *                   type: string
 *                   description: Postal code
 *                 city:
 *                   type: string
 *                   description: City
 *                 notes:
 *                   type: string
 *                   description: Notes about the customer
 *                 newsletter:
 *                   type: boolean
 *                   description: Newsletter subscription status
 *                 status:
 *                   type: string
 *                   enum: [active, inactive, deleted]
 *                   description: Customer status
 *                 type:
 *                   type: string
 *                   enum: [private, business]
 *                   description: Customer type
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
 *       description: Mark customer as deleted (soft delete)
 *       operationId: deleteCustomer
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
 *       operationId: addCustomerNote
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
 *                 - note
 *               properties:
 *                 note:
 *                   type: string
 *                   minLength: 1
 *                   description: Note content
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
 *       operationId: updateCustomerStatus
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
 *                   enum: [active, inactive, deleted]
 *                   description: New status value
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
 *       operationId: getAllProjects
 *       security:
 *         - bearerAuth: []
 *       parameters:
 *         - in: query
 *           name: status
 *           schema:
 *             type: string
 *             enum: [new, in_progress, completed, canceled]
 *           description: Filter by status
 *         - in: query
 *           name: customerId
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
 *                       allOf:
 *                         - $ref: '#/components/schemas/Project'
 *                         - type: object
 *                           properties:
 *                             customerName:
 *                               type: string
 *                             serviceName:
 *                               type: string
 *                             statusLabel:
 *                               type: string
 *                             statusClass:
 *                               type: string
 *                   pagination:
 *                     $ref: '#/components/schemas/PaginationResult'
 *                   filters:
 *                     type: object
 *                     properties:
 *                       status:
 *                         type: string
 *                       customerId:
 *                         type: integer
 *                       search:
 *                         type: string
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
 *       operationId: createProject
 *       security:
 *         - bearerAuth: []
 *       requestBody:
 *         required: true
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - title
 *                 - startDate
 *               properties:
 *                 title:
 *                   type: string
 *                   minLength: 2
 *                   description: Project title
 *                 customerId:
 *                   type: integer
 *                   description: ID of the associated customer
 *                 serviceId:
 *                   type: integer
 *                   description: ID of the associated service
 *                 startDate:
 *                   type: string
 *                   format: date
 *                   description: Project start date (YYYY-MM-DD)
 *                 endDate:
 *                   type: string
 *                   format: date
 *                   description: Project end date (YYYY-MM-DD)
 *                 amount:
 *                   type: number
 *                   format: float
 *                   description: Project amount
 *                 description:
 *                   type: string
 *                   description: Project description
 *                 status:
 *                   type: string
 *                   enum: [new, in_progress, completed, canceled]
 *                   description: Project status
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
 *       operationId: getProjectById
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
 *                     allOf:
 *                       - $ref: '#/components/schemas/Project'
 *                       - type: object
 *                         properties:
 *                           customerName:
 *                             type: string
 *                           serviceName:
 *                             type: string
 *                           statusLabel:
 *                             type: string
 *                           statusClass:
 *                             type: string
 *                   appointments:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                         title:
 *                           type: string
 *                         date:
 *                           type: string
 *                         statusLabel:
 *                           type: string
 *                         statusClass:
 *                           type: string
 *                   notes:
 *                     type: array
 *                     items:
 *                       $ref: '#/components/schemas/ProjectNote'
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
 *       operationId: updateProject
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
 *                 - title
 *                 - startDate
 *               properties:
 *                 title:
 *                   type: string
 *                   minLength: 2
 *                   description: Project title
 *                 customerId:
 *                   type: integer
 *                   description: ID of the associated customer
 *                 serviceId:
 *                   type: integer
 *                   description: ID of the associated service
 *                 startDate:
 *                   type: string
 *                   format: date
 *                   description: Project start date (YYYY-MM-DD)
 *                 endDate:
 *                   type: string
 *                   format: date
 *                   description: Project end date (YYYY-MM-DD)
 *                 amount:
 *                   type: number
 *                   format: float
 *                   description: Project amount
 *                 description:
 *                   type: string
 *                   description: Project description
 *                 status:
 *                   type: string
 *                   enum: [new, in_progress, completed, canceled]
 *                   description: Project status
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
 *       operationId: updateProjectStatus
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
 *                   enum: [new, in_progress, completed, canceled]
 *                   description: Project status
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
 *       operationId: addProjectNote
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
 *                   minLength: 1
 *                   description: Note content
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
 *       description: |
 *         Export projects data in various formats.
 *         Note: This functionality is currently being migrated to TypeScript and Prisma.
 *       operationId: exportProjects
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
 *       operationId: getAllAppointments
 *       security:
 *         - bearerAuth: []
 *       parameters:
 *         - in: query
 *           name: status
 *           schema:
 *             type: string
 *             enum: [planned, confirmed, completed, canceled]
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
 *                       allOf:
 *                         - $ref: '#/components/schemas/Appointment'
 *                         - type: object
 *                           properties:
 *                             customerName:
 *                               type: string
 *                             projectTitle:
 *                               type: string
 *                             dateFormatted:
 *                               type: string
 *                             timeFormatted:
 *                               type: string
 *                             statusLabel:
 *                               type: string
 *                             statusClass:
 *                               type: string
 *                   pagination:
 *                     $ref: '#/components/schemas/PaginationResult'
 *                   filters:
 *                     type: object
 *                     properties:
 *                       status:
 *                         type: string
 *                       date:
 *                         type: string
 *                       search:
 *                         type: string
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
 *       operationId: createAppointment
 *       security:
 *         - bearerAuth: []
 *       requestBody:
 *         required: true
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - title
 *                 - appointmentDate
 *               properties:
 *                 title:
 *                   type: string
 *                   minLength: 2
 *                   description: Appointment title
 *                 customerId:
 *                   type: integer
 *                   description: ID of the associated customer
 *                 projectId:
 *                   type: integer
 *                   description: ID of the associated project
 *                 appointmentDate:
 *                   type: string
 *                   format: date-time
 *                   description: Appointment date and time
 *                 duration:
 *                   type: integer
 *                   default: 60
 *                   description: Duration in minutes
 *                 location:
 *                   type: string
 *                   description: Appointment location
 *                 description:
 *                   type: string
 *                   description: Appointment description
 *                 status:
 *                   type: string
 *                   enum: [planned, confirmed, completed, canceled]
 *                   default: planned
 *                   description: Appointment status
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
 *       operationId: getAppointmentById
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
 *                     allOf:
 *                       - $ref: '#/components/schemas/Appointment'
 *                       - type: object
 *                         properties:
 *                           customerName:
 *                             type: string
 *                           projectTitle:
 *                             type: string
 *                           dateFormatted:
 *                             type: string
 *                           timeFormatted:
 *                             type: string
 *                           statusLabel:
 *                             type: string
 *                           statusClass:
 *                             type: string
 *                   notes:
 *                     type: array
 *                     items:
 *                       $ref: '#/components/schemas/AppointmentNote'
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
 *       operationId: updateAppointment
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
 *                 - title
 *                 - appointmentDate
 *               properties:
 *                 title:
 *                   type: string
 *                   minLength: 2
 *                   description: Appointment title
 *                 customerId:
 *                   type: integer
 *                   description: ID of the associated customer
 *                 projectId:
 *                   type: integer
 *                   description: ID of the associated project
 *                 appointmentDate:
 *                   type: string
 *                   format: date-time
 *                   description: Appointment date and time
 *                 duration:
 *                   type: integer
 *                   default: 60
 *                   description: Duration in minutes
 *                 location:
 *                   type: string
 *                   description: Appointment location
 *                 description:
 *                   type: string
 *                   description: Appointment description
 *                 status:
 *                   type: string
 *                   enum: [planned, confirmed, completed, canceled]
 *                   description: Appointment status
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
 *       operationId: deleteAppointment
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
 *       operationId: updateAppointmentStatus
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
 *                   enum: [planned, confirmed, completed, canceled]
 *                   description: Appointment status
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
 *       operationId: addAppointmentNote
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
 *                   minLength: 1
 *                   description: Note content
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
 *       operationId: getAllServices
 *       security:
 *         - bearerAuth: []
 *       parameters:
 *         - in: query
 *           name: status
 *           schema:
 *             type: string
 *             enum: [active, inactive]
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
 *                       $ref: '#/components/schemas/Service'
 *                   pagination:
 *                     $ref: '#/components/schemas/PaginationResult'
 *                   filters:
 *                     type: object
 *                     properties:
 *                       status:
 *                         type: string
 *                       search:
 *                         type: string
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
 *       operationId: createService
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
 *                 - priceBase
 *                 - unit
 *               properties:
 *                 name:
 *                   type: string
 *                   minLength: 2
 *                   description: Service name
 *                 description:
 *                   type: string
 *                   description: Service description
 *                 priceBase:
 *                   type: number
 *                   format: float
 *                   minimum: 0
 *                   description: Base price
 *                 unit:
 *                   type: string
 *                   description: Unit (e.g., hour, piece)
 *                 vatRate:
 *                   type: number
 *                   format: float
 *                   default: 20
 *                   description: VAT rate in percentage
 *                 active:
 *                   type: boolean
 *                   default: true
 *                   description: Service status
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
 *       operationId: getServiceById
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
 *                     $ref: '#/components/schemas/Service'
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
 *       operationId: updateService
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
 *                 - name
 *                 - priceBase
 *                 - unit
 *               properties:
 *                 name:
 *                   type: string
 *                   minLength: 2
 *                   description: Service name
 *                 description:
 *                   type: string
 *                   description: Service description
 *                 priceBase:
 *                   type: number
 *                   format: float
 *                   minimum: 0
 *                   description: Base price
 *                 unit:
 *                   type: string
 *                   description: Unit (e.g., hour, piece)
 *                 vatRate:
 *                   type: number
 *                   format: float
 *                   default: 20
 *                   description: VAT rate in percentage
 *                 active:
 *                   type: boolean
 *                   description: Service status
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
 *       operationId: toggleServiceStatus
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
 *                 - active
 *               properties:
 *                 active:
 *                   type: boolean
 *                   description: Active status
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
 *       operationId: getServiceStatistics
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
 *                     properties:
 *                       name:
 *                         type: string
 *                       totalRevenue:
 *                         type: number
 *                       invoiceCount:
 *                         type: integer
 *                       monthlyRevenue:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             month:
 *                               type: string
 *                             revenue:
 *                               type: number
 *                       topCustomers:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             customerId:
 *                               type: integer
 *                             customerName:
 *                               type: string
 *                             revenue:
 *                               type: number
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
 *       operationId: getAllRequests
 *       security:
 *         - bearerAuth: []
 *       parameters:
 *         - in: query
 *           name: status
 *           schema:
 *             type: string
 *             enum: [new, in_progress, answered, closed]
 *           description: Filter by status
 *         - in: query
 *           name: service
 *           schema:
 *             type: string
 *             enum: [facility, moving, winter, other]
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
 *                       allOf:
 *                         - $ref: '#/components/schemas/ContactRequest'
 *                         - type: object
 *                           properties:
 *                             serviceLabel:
 *                               type: string
 *                             formattedDate:
 *                               type: string
 *                             statusLabel:
 *                               type: string
 *                             statusClass:
 *                               type: string
 *                   pagination:
 *                     $ref: '#/components/schemas/PaginationResult'
 *                   filters:
 *                     type: object
 *                     properties:
 *                       status:
 *                         type: string
 *                       service:
 *                         type: string
 *                       date:
 *                         type: string
 *                       search:
 *                         type: string
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
 *       operationId: getRequestById
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
 *                     allOf:
 *                       - $ref: '#/components/schemas/ContactRequest'
 *                       - type: object
 *                         properties:
 *                           serviceLabel:
 *                             type: string
 *                           formattedDate:
 *                             type: string
 *                           statusLabel:
 *                             type: string
 *                           statusClass:
 *                             type: string
 *                   notes:
 *                     type: array
 *                     items:
 *                       $ref: '#/components/schemas/RequestNote'
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
 *       operationId: updateRequestStatus
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
 *                   enum: [new, in_progress, answered, closed]
 *                   description: Request status
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
 *       operationId: addRequestNote
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
 *                   minLength: 1
 *                   description: Note content
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
 * /api/v1/requests/export:
 *     get:
 *       tags: [Requests]
 *       summary: Export requests
 *       description: |
 *         Export contact requests data in various formats.
 *         Note: This functionality is currently being migrated to TypeScript and Prisma.
 *       operationId: exportRequests
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
 *       operationId: getUserProfile
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
 *                   activity:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         type:
 *                           type: string
 *                         ip:
 *                           type: string
 *                         date:
 *                           type: string
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
 *       operationId: updateProfile
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
 *                   minLength: 2
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
 *                     properties:
 *                       id:
 *                         type: integer
 *                       name:
 *                         type: string
 *                       email:
 *                         type: string
 *                       role:
 *                         type: string
 *                       initials:
 *                         type: string
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
 *       operationId: updatePassword
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
 *                   minLength: 8
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
 *       operationId: updateProfilePicture
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
 *       operationId: updateNotificationSettings
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
 *       operationId: getDashboardStats
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
 * 
 *   /api/v1/dashboard/data:
 *     get:
 *       tags: [Dashboard]
 *       summary: Get complete dashboard data
 *       description: Retrieve all dashboard data including statistics, charts, and recent activities
 *       operationId: getDashboardData
 *       security:
 *         - bearerAuth: []
 *       parameters:
 *         - in: query
 *           name: revenueFilter
 *           schema:
 *             type: string
 *             enum: ['Letzten 30 Tage', 'Letzten 3 Monate', 'Letzten 6 Monate', 'Dieses Jahr']
 *           description: Filter for revenue chart
 *         - in: query
 *           name: servicesFilter
 *           schema:
 *             type: string
 *             enum: ['Diese Woche', 'Diesen Monat', 'Dieses Quartal', 'Dieses Jahr']
 *           description: Filter for services chart
 *       responses:
 *         200:
 *           description: Complete dashboard data
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   stats:
 *                     type: object
 *                   chartFilters:
 *                     type: object
 *                     properties:
 *                       revenue:
 *                         type: object
 *                       services:
 *                         type: object
 *                   charts:
 *                     type: object
 *                     properties:
 *                       revenue:
 *                         type: object
 *                         properties:
 *                           labels:
 *                             type: array
 *                             items:
 *                               type: string
 *                           data:
 *                             type: array
 *                             items:
 *                               type: number
 *                       services:
 *                         type: object
 *                         properties:
 *                           labels:
 *                             type: array
 *                             items:
 *                               type: string
 *                           data:
 *                             type: array
 *                             items:
 *                               type: number
 *                   notifications:
 *                     type: array
 *                     items:
 *                       type: object
 *                   recentRequests:
 *                     type: array
 *                     items:
 *                       type: object
 *                   upcomingAppointments:
 *                     type: array
 *                     items:
 *                       type: object
 *                   systemStatus:
 *                     type: object
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
 *       operationId: globalSearch
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
 *                       properties:
 *                         id:
 *                           type: integer
 *                         name:
 *                           type: string
 *                         email:
 *                           type: string
 *                         firma:
 *                           type: string
 *                         telefon:
 *                           type: string
 *                         status:
 *                           type: string
 *                         type:
 *                           type: string
 *                         url:
 *                           type: string
 *                   projects:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                         title:
 *                           type: string
 *                         status:
 *                           type: string
 *                         date:
 *                           type: string
 *                         kunde:
 *                           type: string
 *                         type:
 *                           type: string
 *                         url:
 *                           type: string
 *                   appointments:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                         title:
 *                           type: string
 *                         status:
 *                           type: string
 *                         date:
 *                           type: string
 *                         kunde:
 *                           type: string
 *                         type:
 *                           type: string
 *                         url:
 *                           type: string
 *                   requests:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                         name:
 *                           type: string
 *                         email:
 *                           type: string
 *                         status:
 *                           type: string
 *                         date:
 *                           type: string
 *                         type:
 *                           type: string
 *                         url:
 *                           type: string
 *                   services:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                         name:
 *                           type: string
 *                         preis:
 *                           type: number
 *                         einheit:
 *                           type: string
 *                         aktiv:
 *                           type: boolean
 *                         type:
 *                           type: string
 *                         url:
 *                           type: string
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
 *       operationId: getNotifications
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
 *                         timestamp:
 *                           type: string
 *                           format: date-time
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
 *       operationId: markNotificationsRead
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
 *       operationId: getUserSettings
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
 *       operationId: updateUserSettings
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
 *       operationId: getSystemSettings
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
 *                     additionalProperties:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           key:
 *                             type: string
 *                           value:
 *                             type: string
 *                           description:
 *                             type: string
 *                           type:
 *                             type: string
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
 *       operationId: updateSystemSettings
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
 *                   additionalProperties:
 *                     type: string
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
 *       operationId: getBackupSettings
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
 *                         enum: [taeglich, woechentlich, monatlich]
 *                       zeit:
 *                         type: string
 *                         pattern: "^([01]\\d|2[0-3]):([0-5]\\d)$"
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
 *                       properties:
 *                         id: 
 *                           type: integer
 *                         dateiname:
 *                           type: string
 *                         groesse:
 *                           type: string
 *                         datum:
 *                           type: string
 *                           format: date-time
 *                         status:
 *                           type: string
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
 *       operationId: updateBackupSettings
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
 *                   minimum: 1
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
 *       operationId: triggerManualBackup
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
 *       operationId: submitContact
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
 *   # Health check endpoint
 *   /health:
 *     get:
 *       tags: [System]
 *       summary: Health check
 *       description: Check if the API is running
 *       operationId: healthCheck
 *       responses:
 *         200:
 *           description: API is running
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   status:
 *                     type: string
 *                     example: ok
 *                   timestamp:
 *                     type: string
 *                     format: date-time
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
 *   - name: System
 *     description: System and health check endpoints
 */