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
 *           description: Customer email
 *         telefon:
 *           type: string
 *           description: Phone number
 *         adresse:
 *           type: string
 *           description: Address
 *         plz:
 *           type: string
 *           description: Postal code
 *         ort:
 *           type: string
 *           description: City
 *         notizen:
 *           type: string
 *           description: Notes
 *         newsletter:
 *           type: boolean
 *           description: Newsletter subscription
 *         status:
 *           type: string
 *           enum: [aktiv, inaktiv, geloescht]
 *           description: Status
 *         kundentyp:
 *           type: string
 *           enum: [privat, geschaeft]
 *           description: Customer type
 *       example:
 *         name: "Max Mustermann"
 *         firma: "ABC GmbH"
 *         email: "max@example.com"
 *         telefon: "+43 123 456789"
 *         adresse: "Hauptstraße 1"
 *         plz: "1010"
 *         ort: "Wien"
 *         notizen: "VIP Kunde"
 *         newsletter: true
 *         status: "aktiv"
 *         kundentyp: "geschaeft"
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
 *           description: Customer ID
 *         dienstleistung_id:
 *           type: integer
 *           description: Service ID
 *         start_datum:
 *           type: string
 *           format: date
 *           description: Start date
 *         end_datum:
 *           type: string
 *           format: date
 *           description: End date
 *         betrag:
 *           type: number
 *           format: float
 *           description: Project amount
 *         beschreibung:
 *           type: string
 *           description: Description
 *         status:
 *           type: string
 *           enum: [neu, in_bearbeitung, abgeschlossen, storniert]
 *           description: Status
 *       example:
 *         titel: "Website Relaunch"
 *         kunde_id: 1
 *         dienstleistung_id: 2
 *         start_datum: "2023-06-01"
 *         end_datum: "2023-08-31"
 *         betrag: 15000
 *         beschreibung: "Kompletter Relaunch der Unternehmenswebsite"
 *         status: "in_bearbeitung"
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
 *           description: Customer ID
 *         projekt_id:
 *           type: integer
 *           description: Project ID
 *         termin_datum:
 *           type: string
 *           format: date
 *           description: Appointment date
 *         termin_zeit:
 *           type: string
 *           pattern: '^\d{2}:\d{2}$'
 *           description: Appointment time (HH:MM)
 *         dauer:
 *           type: integer
 *           description: Duration in minutes
 *         ort:
 *           type: string
 *           description: Location
 *         beschreibung:
 *           type: string
 *           description: Description
 *         status:
 *           type: string
 *           enum: [geplant, bestaetigt, abgeschlossen, storniert]
 *           description: Status
 *       example:
 *         titel: "Projektbesprechung"
 *         kunde_id: 1
 *         projekt_id: 2
 *         termin_datum: "2023-07-15"
 *         termin_zeit: "14:30"
 *         dauer: 60
 *         ort: "Büro Wien"
 *         beschreibung: "Besprechung der nächsten Schritte"
 *         status: "geplant"
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
 *           description: Description
 *         preis_basis:
 *           type: number
 *           format: float
 *           description: Base price
 *         einheit:
 *           type: string
 *           description: Unit (e.g., hour, day, project)
 *         mwst_satz:
 *           type: number
 *           format: float
 *           description: VAT rate
 *         aktiv:
 *           type: boolean
 *           description: Active status
 *       example:
 *         name: "Webentwicklung"
 *         beschreibung: "Programmierung und Entwicklung von Webseiten"
 *         preis_basis: 120
 *         einheit: "Stunde"
 *         mwst_satz: 20
 *         aktiv: true
 *
 *     UserSettings:
 *       type: object
 *       properties:
 *         sprache:
 *           type: string
 *           enum: [de, en]
 *           description: Language preference
 *         dark_mode:
 *           type: boolean
 *           description: Dark mode preference
 *         benachrichtigungen_email:
 *           type: boolean
 *           description: Email notifications
 *         benachrichtigungen_push:
 *           type: boolean
 *           description: Push notifications
 *         benachrichtigungen_intervall:
 *           type: string
 *           enum: [sofort, taeglich, woechentlich]
 *           description: Notification interval
 *       example:
 *         sprache: "de"
 *         dark_mode: true
 *         benachrichtigungen_email: true
 *         benachrichtigungen_push: false
 *         benachrichtigungen_intervall: "taeglich"
 *
 *     ContactRequest:
 *       type: object
 *       required:
 *         - name
 *         - email
 *         - service
 *         - message
 *       properties:
 *         name:
 *           type: string
 *           description: Name of the contact
 *         email:
 *           type: string
 *           format: email
 *           description: Email address
 *         phone:
 *           type: string
 *           description: Phone number
 *         service:
 *           type: string
 *           description: Requested service
 *         message:
 *           type: string
 *           description: Message content
 *       example:
 *         name: "John Doe"
 *         email: "john@example.com"
 *         phone: "+43 123 456789"
 *         service: "Webentwicklung"
 *         message: "Ich interessiere mich für eine neue Website für mein Unternehmen."
 *
 *     BackupSettings:
 *       type: object
 *       properties:
 *         automatisch:
 *           type: boolean
 *           description: Automatic backup
 *         intervall:
 *           type: string
 *           enum: [taeglich, woechentlich, monatlich]
 *           description: Backup interval
 *         zeit:
 *           type: string
 *           pattern: '^\d{2}:\d{2}$'
 *           description: Backup time (HH:MM)
 *         aufbewahrung:
 *           type: integer
 *           description: Retention period in days
 *       example:
 *         automatisch: true
 *         intervall: "taeglich"
 *         zeit: "02:00"
 *         aufbewahrung: 30
 * 
 * paths:
 *   # Authentication Endpoints
 *   /api/v1/auth/login:
 *     post:
 *       tags: [Authentication]
 *       summary: Login to get access token
 *       description: Authenticates user and returns JWT tokens
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
 *               email: "admin@example.com"
 *               password: "Password123!"
 *               remember: true
 *       responses:
 *         200:
 *           description: Successful authentication
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
 *                         type: number
 *                       name:
 *                         type: string
 *                       email:
 *                         type: string
 *                       role:
 *                         type: string
 *         401:
 *           description: Authentication failed
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
 *                     example: 'Invalid email or password'
 *
 *   /api/v1/auth/refresh-token:
 *     post:
 *       tags: [Authentication]
 *       summary: Refresh JWT token
 *       description: Get new access token using a refresh token
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
 *           description: New tokens generated
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
 *
 *   /api/v1/auth/forgot-password:
 *     post:
 *       tags: [Authentication]
 *       summary: Request password reset
 *       description: Request a password reset link
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
 *           description: Password reset request processed
 *
 *   /api/v1/auth/reset-token/{token}:
 *     get:
 *       tags: [Authentication]
 *       summary: Validate reset token
 *       description: Check if password reset token is valid
 *       parameters:
 *         - in: path
 *           name: token
 *           required: true
 *           schema:
 *             type: string
 *       responses:
 *         200:
 *           description: Token is valid
 *         400:
 *           description: Invalid or expired token
 *
 *   /api/v1/auth/reset-password/{token}:
 *     post:
 *       tags: [Authentication]
 *       summary: Reset password
 *       description: Reset password with token
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
 *         400:
 *           description: Invalid input or token
 *
 *   /api/v1/auth/logout:
 *     post:
 *       tags: [Authentication]
 *       summary: Logout
 *       description: Invalidate the refresh token
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
 *           description: Logged out successfully
 *
 *   # Customer Endpoints
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
 *           description: Search term
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
 *                   customers:
 *                     type: array
 *                     items:
 *                       $ref: '#/components/schemas/Customer'
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
 *         401:
 *           description: Unauthorized
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
 *           description: Customer created
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   success:
 *                     type: boolean
 *                   customerId:
 *                     type: integer
 *                   message:
 *                     type: string
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
 *                   customer:
 *                     $ref: '#/components/schemas/Customer'
 *         404:
 *           description: Customer not found
 *         401:
 *           description: Unauthorized
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
 *       requestBody:
 *         required: true
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Customer'
 *       responses:
 *         200:
 *           description: Customer updated successfully
 *         400:
 *           description: Invalid input
 *         404:
 *           description: Customer not found
 *         401:
 *           description: Unauthorized
 *     delete:
 *       tags: [Customers]
 *       summary: Delete customer
 *       description: Mark customer as deleted (soft delete)
 *       security:
 *         - bearerAuth: []
 *       parameters:
 *         - in: path
 *           name: id
 *           required: true
 *           schema:
 *             type: integer
 *       responses:
 *         200:
 *           description: Customer deleted successfully
 *         404:
 *           description: Customer not found
 *         401:
 *           description: Unauthorized
 *         400:
 *           description: Cannot delete customer with active projects
 *
 *   # Additional Customer Endpoints
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
 *       requestBody:
 *         required: true
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 notiz:
 *                   type: string
 *       responses:
 *         200:
 *           description: Note added successfully
 *         404:
 *           description: Customer not found
 *         401:
 *           description: Unauthorized
 *
 *   /api/v1/customers/status:
 *     patch:
 *       tags: [Customers]
 *       summary: Update customer status
 *       description: Update the status of a customer
 *       security:
 *         - bearerAuth: []
 *       requestBody:
 *         required: true
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 status:
 *                   type: string
 *                   enum: [aktiv, inaktiv, geloescht]
 *       responses:
 *         200:
 *           description: Status updated successfully
 *         400:
 *           description: Invalid input
 *         401:
 *           description: Unauthorized
 * 
 *   # Project Endpoints
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
 *           description: Search term
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
 *                   projects:
 *                     type: array
 *                     items:
 *                       $ref: '#/components/schemas/Project'
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
 *         401:
 *           description: Unauthorized
 *     post:
 *       tags: [Projects]
 *       summary: Create new project
 *       description: Add a new project to the database
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
 *                   projectId:
 *                     type: integer
 *                   message:
 *                     type: string
 *         400:
 *           description: Invalid input
 *         401:
 *           description: Unauthorized
 *
 *   /api/v1/projects/{id}:
 *     get:
 *       tags: [Projects]
 *       summary: Get project by ID
 *       description: Retrieve detailed information for a specific project
 *       security:
 *         - bearerAuth: []
 *       parameters:
 *         - in: path
 *           name: id
 *           required: true
 *           schema:
 *             type: integer
 *       responses:
 *         200:
 *           description: Successful operation
 *         404:
 *           description: Project not found
 *         401:
 *           description: Unauthorized
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
 *       requestBody:
 *         required: true
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Project'
 *       responses:
 *         200:
 *           description: Project updated successfully
 *         400:
 *           description: Invalid input
 *         404:
 *           description: Project not found
 *         401:
 *           description: Unauthorized
 *
 *   /api/v1/projects/{id}/status:
 *     patch:
 *       tags: [Projects]
 *       summary: Update project status
 *       description: Update the status of a project
 *       security:
 *         - bearerAuth: []
 *       parameters:
 *         - in: path
 *           name: id
 *           required: true
 *           schema:
 *             type: integer
 *       requestBody:
 *         required: true
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   enum: [neu, in_bearbeitung, abgeschlossen, storniert]
 *                 note:
 *                   type: string
 *       responses:
 *         200:
 *           description: Status updated successfully
 *         400:
 *           description: Invalid input
 *         404:
 *           description: Project not found
 *         401:
 *           description: Unauthorized
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
 *       requestBody:
 *         required: true
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 note:
 *                   type: string
 *       responses:
 *         201:
 *           description: Note added successfully
 *         404:
 *           description: Project not found
 *         401:
 *           description: Unauthorized
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
 *       responses:
 *         200:
 *           description: Export successful
 *         401:
 *           description: Unauthorized
 *
 *   # Appointment Endpoints
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
 *             enum: [geplant, bestaetigt, abgeschlossen, storniert]
 *           description: Filter by status
 *         - in: query
 *           name: date
 *           schema:
 *             type: string
 *             format: date
 *           description: Filter by date
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
 *                   appointments:
 *                     type: array
 *                     items:
 *                       $ref: '#/components/schemas/Appointment'
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
 *         401:
 *           description: Unauthorized
 *     post:
 *       tags: [Appointments]
 *       summary: Create new appointment
 *       description: Add a new appointment to the database
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
 *                   appointmentId:
 *                     type: integer
 *                   message:
 *                     type: string
 *         400:
 *           description: Invalid input
 *         401:
 *           description: Unauthorized
 *
 *   /api/v1/appointments/{id}:
 *     get:
 *       tags: [Appointments]
 *       summary: Get appointment by ID
 *       description: Retrieve detailed information for a specific appointment
 *       security:
 *         - bearerAuth: []
 *       parameters:
 *         - in: path
 *           name: id
 *           required: true
 *           schema:
 *             type: integer
 *       responses:
 *         200:
 *           description: Successful operation
 *         404:
 *           description: Appointment not found
 *         401:
 *           description: Unauthorized
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
 *       requestBody:
 *         required: true
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Appointment'
 *       responses:
 *         200:
 *           description: Appointment updated successfully
 *         400:
 *           description: Invalid input
 *         404:
 *           description: Appointment not found
 *         401:
 *           description: Unauthorized
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
 *       responses:
 *         200:
 *           description: Appointment deleted successfully
 *         404:
 *           description: Appointment not found
 *         401:
 *           description: Unauthorized
 *
 *   /api/v1/appointments/{id}/status:
 *     patch:
 *       tags: [Appointments]
 *       summary: Update appointment status
 *       description: Update the status of an appointment
 *       security:
 *         - bearerAuth: []
 *       parameters:
 *         - in: path
 *           name: id
 *           required: true
 *           schema:
 *             type: integer
 *       requestBody:
 *         required: true
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   enum: [geplant, bestaetigt, abgeschlossen, storniert]
 *                 note:
 *                   type: string
 *       responses:
 *         200:
 *           description: Status updated successfully
 *         400:
 *           description: Invalid input
 *         404:
 *           description: Appointment not found
 *         401:
 *           description: Unauthorized
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
 *       requestBody:
 *         required: true
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 note:
 *                   type: string
 *       responses:
 *         201:
 *           description: Note added successfully
 *         404:
 *           description: Appointment not found
 *         401:
 *           description: Unauthorized
 *
 *   # Service Endpoints
 *   /api/v1/services:
 *     get:
 *       tags: [Services]
 *       summary: Get all services
 *       description: Retrieve a list of services with pagination and filtering options
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
 *             enum: [aktiv, inaktiv]
 *           description: Filter by status
 *       responses:
 *         200:
 *           description: Successful operation
 *         401:
 *           description: Unauthorized
 *     post:
 *       tags: [Services]
 *       summary: Create new service
 *       description: Add a new service to the database
 *       security:
 *         - bearerAuth: []
 *       requestBody:
 *         required: true
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 name:
 *                   type: string
 *                 beschreibung:
 *                   type: string
 *                 preis_basis:
 *                   type: number
 *                 einheit:
 *                   type: string
 *                 mwst_satz:
 *                   type: number
 *                 aktiv:
 *                   type: boolean
 *       responses:
 *         201:
 *           description: Service created successfully
 *         400:
 *           description: Invalid input
 *         401:
 *           description: Unauthorized
 *
 *   /api/v1/services/{id}:
 *     get:
 *       tags: [Services]
 *       summary: Get service by ID
 *       description: Retrieve detailed information for a specific service
 *       security:
 *         - bearerAuth: []
 *       parameters:
 *         - in: path
 *           name: id
 *           required: true
 *           schema:
 *             type: integer
 *       responses:
 *         200:
 *           description: Successful operation
 *         404:
 *           description: Service not found
 *         401:
 *           description: Unauthorized
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
 *       requestBody:
 *         required: true
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 name:
 *                   type: string
 *                 beschreibung:
 *                   type: string
 *                 preis_basis:
 *                   type: number
 *                 einheit:
 *                   type: string
 *                 mwst_satz:
 *                   type: number
 *                 aktiv:
 *                   type: boolean
 *       responses:
 *         200:
 *           description: Service updated successfully
 *         400:
 *           description: Invalid input
 *         404:
 *           description: Service not found
 *         401:
 *           description: Unauthorized
 *
 *   /api/v1/services/{id}/status:
 *     patch:
 *       tags: [Services]
 *       summary: Toggle service status
 *       description: Toggle between active and inactive status
 *       security:
 *         - bearerAuth: []
 *       parameters:
 *         - in: path
 *           name: id
 *           required: true
 *           schema:
 *             type: integer
 *       requestBody:
 *         required: true
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 aktiv:
 *                   type: boolean
 *       responses:
 *         200:
 *           description: Status updated successfully
 *         404:
 *           description: Service not found
 *         401:
 *           description: Unauthorized
 *
 *   /api/v1/services/{id}/statistics:
 *     get:
 *       tags: [Services]
 *       summary: Get service statistics
 *       description: Retrieve usage and revenue statistics for a specific service
 *       security:
 *         - bearerAuth: []
 *       parameters:
 *         - in: path
 *           name: id
 *           required: true
 *           schema:
 *             type: integer
 *       responses:
 *         200:
 *           description: Successful operation
 *         404:
 *           description: Service not found
 *         401:
 *           description: Unauthorized
 *
 *   # Request Endpoints
 *   /api/v1/requests:
 *     get:
 *       tags: [Requests]
 *       summary: Get all contact requests
 *       description: Retrieve a list of contact requests with pagination and filtering options
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
 *             enum: [neu, in_bearbeitung, beantwortet, geschlossen]
 *           description: Filter by status
 *         - in: query
 *           name: service
 *           schema:
 *             type: string
 *           description: Filter by service
 *       responses:
 *         200:
 *           description: List of contact requests
 *         401:
 *           description: Unauthorized
 *
 *   /api/v1/requests/{id}:
 *     get:
 *       tags: [Requests]
 *       summary: Get contact request by ID
 *       description: Retrieve detailed information for a specific contact request
 *       security:
 *         - bearerAuth: []
 *       parameters:
 *         - in: path
 *           name: id
 *           required: true
 *           schema:
 *             type: integer
 *       responses:
 *         200:
 *           description: Contact request details
 *         404:
 *           description: Contact request not found
 *         401:
 *           description: Unauthorized
 *
 *   /api/v1/requests/{id}/status:
 *     patch:
 *       tags: [Requests]
 *       summary: Update request status
 *       description: Update the status of a contact request
 *       security:
 *         - bearerAuth: []
 *       parameters:
 *         - in: path
 *           name: id
 *           required: true
 *           schema:
 *             type: integer
 *       requestBody:
 *         required: true
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   enum: [neu, in_bearbeitung, beantwortet, geschlossen]
 *                 note:
 *                   type: string
 *       responses:
 *         200:
 *           description: Status updated successfully
 *         400:
 *           description: Invalid input
 *         404:
 *           description: Contact request not found
 *         401:
 *           description: Unauthorized
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
 *       requestBody:
 *         required: true
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 note:
 *                   type: string
 *       responses:
 *         201:
 *           description: Note added successfully
 *         404:
 *           description: Contact request not found
 *         401:
 *           description: Unauthorized
 *
 *   /api/v1/requests/export:
 *     get:
 *       tags: [Requests]
 *       summary: Export requests
 *       description: Export contact requests in various formats
 *       security:
 *         - bearerAuth: []
 *       parameters:
 *         - in: query
 *           name: format
 *           schema:
 *             type: string
 *             enum: [csv, xlsx, pdf, json]
 *           description: Export format
 *       responses:
 *         200:
 *           description: Export successful
 *         401:
 *           description: Unauthorized
 *
 *   # Dashboard Endpoints
 *   /api/v1/dashboard/stats:
 *     get:
 *       tags: [Dashboard]
 *       summary: Get dashboard statistics
 *       description: Retrieve key metrics and statistics for the dashboard
 *       security:
 *         - bearerAuth: []
 *       responses:
 *         200:
 *           description: Dashboard statistics
 *         401:
 *           description: Unauthorized
 *
 *   /api/v1/dashboard/search:
 *     get:
 *       tags: [Dashboard]
 *       summary: Global search
 *       description: Search across all entities
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
 *         401:
 *           description: Unauthorized
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
 *           description: List of notifications
 *         401:
 *           description: Unauthorized
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
 *                 markAll:
 *                   type: boolean
 *       responses:
 *         200:
 *           description: Notifications marked as read
 *         401:
 *           description: Unauthorized
 *
 *   # Profile Endpoints
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
 *         401:
 *           description: Unauthorized
 *     put:
 *       tags: [Profile]
 *       summary: Update profile
 *       description: Update current user profile information
 *       security:
 *         - bearerAuth: []
 *       requestBody:
 *         required: true
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 name:
 *                   type: string
 *                 email:
 *                   type: string
 *                 telefon:
 *                   type: string
 *       responses:
 *         200:
 *           description: Profile updated successfully
 *         400:
 *           description: Invalid input
 *         401:
 *           description: Unauthorized
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
 *               properties:
 *                 current_password:
 *                   type: string
 *                 new_password:
 *                   type: string
 *                 confirm_password:
 *                   type: string
 *       responses:
 *         200:
 *           description: Password updated successfully
 *         400:
 *           description: Invalid input
 *         401:
 *           description: Unauthorized
 *
 *   /api/v1/profile/picture:
 *     patch:
 *       tags: [Profile]
 *       summary: Update profile picture
 *       description: Upload a new profile picture
 *       security:
 *         - bearerAuth: []
 *       requestBody:
 *         required: true
 *         content:
 *           multipart/form-data:
 *             schema:
 *               type: object
 *               properties:
 *                 file:
 *                   type: string
 *                   format: binary
 *       responses:
 *         200:
 *           description: Profile picture updated successfully
 *         400:
 *           description: Invalid file
 *         401:
 *           description: Unauthorized
 *
 *   /api/v1/profile/notifications:
 *     patch:
 *       tags: [Profile]
 *       summary: Update notification settings
 *       description: Change notification preferences
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
 *           description: Notification settings updated successfully
 *         400:
 *           description: Invalid input
 *         401:
 *           description: Unauthorized
 *
 *   # Settings Endpoints
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
 *         401:
 *           description: Unauthorized
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
 *                 dark_mode:
 *                   type: boolean
 *                 benachrichtigungen_email:
 *                   type: boolean
 *                 benachrichtigungen_push:
 *                   type: boolean
 *                 benachrichtigungen_intervall:
 *                   type: string
 *       responses:
 *         200:
 *           description: Settings updated successfully
 *         400:
 *           description: Invalid input
 *         401:
 *           description: Unauthorized
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
 *         401:
 *           description: Unauthorized
 *         403:
 *           description: Forbidden - Admin access required
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
 *           description: System settings updated successfully
 *         400:
 *           description: Invalid input
 *         401:
 *           description: Unauthorized
 *         403:
 *           description: Forbidden - Admin access required
 *
 *   /api/v1/settings/backup:
 *     get:
 *       tags: [Settings]
 *       summary: Get backup settings
 *       description: Retrieve backup settings (admin only)
 *       security:
 *         - bearerAuth: []
 *       responses:
 *         200:
 *           description: Backup settings
 *         401:
 *           description: Unauthorized
 *         403:
 *           description: Forbidden - Admin access required
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
 *               $ref: '#/components/schemas/BackupSettings'
 *       responses:
 *         200:
 *           description: Backup settings updated successfully
 *         400:
 *           description: Invalid input
 *         401:
 *           description: Unauthorized
 *         403:
 *           description: Forbidden - Admin access required
 *
 *   /api/v1/settings/backup/trigger:
 *     post:
 *       tags: [Settings]
 *       summary: Trigger manual backup
 *       description: Start a manual backup (admin only)
 *       security:
 *         - bearerAuth: []
 *       responses:
 *         200:
 *           description: Backup process initiated
 *         401:
 *           description: Unauthorized
 *         403:
 *           description: Forbidden - Admin access required
 *
 *   # Contact Endpoint
 *   /api/v1/contact:
 *     post:
 *       tags: [Contact]
 *       summary: Submit contact form
 *       description: Send a contact request from the website
 *       requestBody:
 *         required: true
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ContactRequest'
 *       responses:
 *         201:
 *           description: Contact request received
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   success:
 *                     type: boolean
 *                   message:
 *                     type: string
 *                   requestId:
 *                     type: integer
 *         400:
 *           description: Invalid input
 *         429:
 *           description: Too many requests
  */
export{};