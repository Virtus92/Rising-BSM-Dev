/**
 * Allgemeiner Status für verschiedene Entitäten
 */
export enum CommonStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
  PENDING = "pending",
  ARCHIVED = "archived",
  SUSPENDED = "suspended",
  DELETED = "deleted"
}

/**
 * Kundenstatus
 * 
 * @deprecated Verwende stattdessen CommonStatus
 */
// This enum is kept for backward compatibility only
// All new code should use CommonStatus instead
export enum CustomerStatus {
  ACTIVE = CommonStatus.ACTIVE,
  INACTIVE = CommonStatus.INACTIVE,
  DELETED = CommonStatus.DELETED
}

/**
 * Terminstatus
 */
export enum AppointmentStatus {
  PLANNED = "planned",
  CONFIRMED = "confirmed",
  CANCELLED = "cancelled",
  IN_PROGRESS = "in_progress",
  COMPLETED = "completed",
  RESCHEDULED = "rescheduled",
  SCHEDULED = "scheduled"
}

/**
 * Kundentyp
 */
export enum CustomerType {
  PRIVATE = "private",
  BUSINESS = "business",
  INDIVIDUAL = "individual",
  GOVERNMENT = "government",
  NON_PROFIT = "non_profit"
}

/**
 * Anfragestatus
 */
export enum RequestStatus {
  NEW = "new",
  IN_PROGRESS = "in_progress",
  COMPLETED = "completed",
  CANCELLED = "cancelled"
}

/**
 * Request type
 */
export enum RequestType {
  GENERAL = "general",
  SUPPORT = "support",
  SALES = "sales",
  BILLING = "billing",
  FEEDBACK = "feedback",
  COMPLAINT = "complaint",
  INFORMATION = "information",
  OTHER = "other"
}

/**
 * Benachrichtigungstyp
 */
export enum NotificationType {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  SUCCESS = 'success',
  SYSTEM = 'system',
  TASK = 'task',
  APPOINTMENT = 'appointment',
  REQUEST = 'request',
  FILE = 'file',
  CONTACT = 'contact',
  CUSTOMER = 'customer',
  USER = 'user',
  PROJECT = 'project',
  MESSAGE = 'message',
  ALERT = 'alert'
}

/**
 * Aktionstypen für Protokolleinträge
 */
export enum LogActionType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  VIEW = 'view',
  LOGIN = 'login',
  LOGOUT = 'logout',
  RESET_PASSWORD = 'reset_password',
  CHANGE_PASSWORD = 'change_password',
  CHANGE_STATUS = 'change_status',
  CHANGE_ROLE = 'change_role',
  CHANGE_PERMISSION = 'change_permission',
  CHANGE_SETTINGS = 'change_settings',
  CHANGE_PROFILE = 'change_profile',
  ASSIGN = 'assign',
  LINK = 'link',
  CONVERT = 'convert',
  NOTE = 'note'
}
