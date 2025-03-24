/**
 * Core Model Types
 * 
 * Type definitions that directly align with the Prisma schema models.
 * These types represent the database entities as defined in schema.prisma.
 */

/**
 * Base entity interface with common fields
 */
export interface BaseEntity {
    id: number;
    createdAt: Date;
    updatedAt: Date;
  }
  
  /**
   * User model
   */
  export interface User extends BaseEntity {
    name: string;
    email: string;
    password: string;
    role: string;
    phone?: string | null;
    status: string;
    profilePicture?: string | null;
    resetToken?: string | null;
    resetTokenExpiry?: Date | null;
    
    // Relations
    settings?: UserSettings | null;
    activities?: UserActivity[];
    projects?: Project[];
    appointments?: Appointment[];
    refreshTokens?: RefreshToken[];
    serviceLogs?: ServiceLog[];
    customerLogs?: CustomerLog[];
    requestLogs?: RequestLog[];
    projectNotes?: ProjectNote[];
    requestNotes?: RequestNote[];
    appointmentNotes?: AppointmentNote[];
    appointmentLogs?: AppointmentLog[];
  }
  
  /**
   * UserSettings model
   */
  export interface UserSettings extends BaseEntity {
    userId: number;
    darkMode: boolean;
    emailNotifications: boolean;
    pushNotifications: boolean;
    language: string;
    notificationInterval: string;
    
    // Relations
    user: User;
  }
  
  /**
   * UserActivity model
   */
  export interface UserActivity {
    id: number;
    userId: number;
    timestamp?: Date | null;
    activity: string;
    ipAddress?: string | null;
    
    // Relations
    user: User;
  }
  
  /**
   * UserSession model
   */
  export interface UserSession {
    sid: string;
    sess: any;
    expire: Date;
  }
  
  /**
   * RefreshToken model
   */
  export interface RefreshToken {
    id: number;
    token: string;
    expires: Date;
    createdAt: Date;
    createdByIp?: string | null;
    revoked: boolean;
    revokedAt?: Date | null;
    revokedByIp?: string | null;
    replacedByToken?: string | null;
    userId: number;
    
    // Relations
    user: User;
  }
  
  /**
   * SystemSettings model
   */
  export interface SystemSettings {
    id: number;
    key: string;
    value: string;
    description?: string | null;
    createdAt: Date;
    updatedAt: Date;
  }
  
  /**
   * Customer model
   */
  export interface Customer extends BaseEntity {
    name: string;
    company?: string | null;
    email?: string | null;
    phone?: string | null;
    address?: string | null;
    postalCode?: string | null;
    city?: string | null;
    country: string;
    notes?: string | null;
    newsletter: boolean;
    status: string;
    type: string;
    
    // Relations
    projects?: Project[];
    appointments?: Appointment[];
    invoices?: Invoice[];
    logs?: CustomerLog[];
  }
  
  /**
   * CustomerLog model
   */
  export interface CustomerLog {
    id: number;
    customerId: number;
    userId?: number | null;
    userName: string;
    action: string;
    details?: string | null;
    createdAt: Date;
    
    // Relations
    user?: User | null;
    customer: Customer;
  }
  
  /**
   * Service model
   */
  export interface Service extends BaseEntity {
    name: string;
    description?: string | null;
    basePrice: number;
    vatRate: number;
    active: boolean;
    unit?: string | null;
    
    // Relations
    projects?: Project[];
    invoiceItems?: InvoiceItem[];
    logs?: ServiceLog[];
  }
  
  /**
   * ServiceLog model
   */
  export interface ServiceLog {
    id: number;
    serviceId: number;
    userId?: number | null;
    userName?: string | null;
    action: string;
    details?: string | null;
    createdAt: Date;
    
    // Relations
    user?: User | null;
    service: Service;
  }
  
  /**
   * Project model
   */
  export interface Project extends BaseEntity {
    title: string;
    customerId?: number | null;
    serviceId?: number | null;
    startDate?: Date | null;
    endDate?: Date | null;
    amount?: number | null;
    description?: string | null;
    status: string;
    createdBy?: number | null;
    
    // Relations
    customer?: Customer | null;
    service?: Service | null;
    creator?: User | null;
    invoices?: Invoice[];
    appointments?: Appointment[];
    notes?: ProjectNote[];
  }
  
  /**
   * ProjectNote model
   */
  export interface ProjectNote {
    id: number;
    projectId?: number | null;
    userId?: number | null;
    userName: string;
    text: string;
    createdAt: Date;
    
    // Relations
    project?: Project | null;
    user?: User | null;
  }
  
  /**
   * ProjectLog model
   */
  export interface ProjectLog {
    id: number;
    projectId: number;
    userId: number;
    userName: string;
    action: string;
    details?: string | null;
    createdAt: Date;
  }
  
  /**
   * Appointment model
   */
  export interface Appointment extends BaseEntity {
    title: string;
    customerId?: number | null;
    projectId?: number | null;
    appointmentDate: Date;
    duration?: number | null;
    location?: string | null;
    description?: string | null;
    status: string;
    createdBy?: number | null;
    
    // Relations
    customer?: Customer | null;
    project?: Project | null;
    creator?: User | null;
    notes?: AppointmentNote[];
  }
  
  /**
   * AppointmentNote model
   */
  export interface AppointmentNote {
    id: number;
    appointmentId: number;
    userId: number;
    userName: string;
    text: string;
    createdAt: Date;
    
    // Relations
    appointment: Appointment;
    user: User;
  }
  
  /**
   * AppointmentLog model
   */
  export interface AppointmentLog {
    id: number;
    appointmentId: number;
    userId: number;
    userName: string;
    action: string;
    details?: string | null;
    createdAt: Date;
    
    // Relations
    user: User;
  }
  
  /**
   * Invoice model
   */
  export interface Invoice extends BaseEntity {
    invoiceNumber: string;
    projectId?: number | null;
    customerId?: number | null;
    amount: number;
    vatAmount: number;
    totalAmount: number;
    invoiceDate: Date;
    dueDate: Date;
    paidAt?: Date | null;
    status: string;
    
    // Relations
    items?: InvoiceItem[];
    project?: Project | null;
    customer?: Customer | null;
  }
  
  /**
   * InvoiceItem model
   */
  export interface InvoiceItem extends BaseEntity {
    invoiceId: number;
    serviceId: number;
    quantity: number;
    unitPrice: number;
    
    // Relations
    invoice: Invoice;
    service: Service;
  }
  
  /**
   * ContactRequest model
   */
  export interface ContactRequest extends BaseEntity {
    name: string;
    email: string;
    phone?: string | null;
    service: string;
    message: string;
    status: string;
    processorId?: number | null;
    ipAddress?: string | null;
    
    // Relations
    notes?: RequestNote[];
  }
  
  /**
   * OldContactRequest model (legacy)
   */
  export interface OldContactRequest {
    id: bigint;
    name?: string | null;
    email?: string | null;
    phone?: string | null;
    service?: string | null;
    message?: string | null;
    createdAt: Date;
  }
  
  /**
   * RequestNote model
   */
  export interface RequestNote {
    id: number;
    requestId: number;
    userId: number;
    userName: string;
    text: string;
    createdAt: Date;
    
    // Relations
    request: ContactRequest;
    user: User;
  }
  
  /**
   * RequestLog model
   */
  export interface RequestLog {
    id: number;
    requestId: number;
    userId: number;
    userName: string;
    action: string;
    details?: string | null;
    createdAt: Date;
    
    // Relations
    user: User;
  }
  
  /**
   * Notification model
   */
  export interface Notification extends BaseEntity {
    userId?: number | null;
    referenceId?: number | null;
    referenceType?: string | null;
    type: string;
    title: string;
    message?: string | null;
    description?: string | null;
    read: boolean;
  }