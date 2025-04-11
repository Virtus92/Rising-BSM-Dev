/**
 * Allgemeiner Status für verschiedene Entitäten
 */
export enum CommonStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
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
  COMPLETED = "completed",
  RESCHEDULED = "rescheduled"
}

/**
 * Kundentyp
 */
export enum CustomerType {
  PRIVATE = "private",
  BUSINESS = "business"
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
  ASSIGN = 'assign',
  LINK = 'link',
  CONVERT = 'convert'
}
