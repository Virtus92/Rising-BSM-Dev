/**
 * @swagger
 * paths:
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
 *   # Dashboard Endpoints
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
 *   # Add Missing Tags
 *   tags:
 *     - name: Profile
 *       description: User profile management
 *     - name: Settings
 *       description: User and system settings
 */