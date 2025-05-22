/**
 * Allgemeiner Status für verschiedene Entitäten
 */
export enum CommonStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE", 
  PENDING = "PENDING",
  ARCHIVED = "ARCHIVED",
  SUSPENDED = "SUSPENDED",
  DELETED = "DELETED"
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
  PLANNED = "PLANNED",
  CONFIRMED = "CONFIRMED",
  CANCELLED = "CANCELLED",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  RESCHEDULED = "RESCHEDULED",
  SCHEDULED = "SCHEDULED",
  NO_SHOW = "NO_SHOW"
}

/**
 * Kundentyp
 */
export enum CustomerType {
  PRIVATE = "PRIVATE",
  BUSINESS = "BUSINESS",
  INDIVIDUAL = "INDIVIDUAL",
  GOVERNMENT = "GOVERNMENT",
  NON_PROFIT = "NON_PROFIT"
}

/**
 * Anfragestatus
 */
export enum RequestStatus {
  NEW = "NEW",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED"
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
