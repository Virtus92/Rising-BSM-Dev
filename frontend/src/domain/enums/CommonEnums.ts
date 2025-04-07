/**
 * Allgemeiner Status für verschiedene Entitäten
 */
export enum CommonStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
  DELETED = "deleted"
}

/**
 * Projektstatus
 */
export enum ProjectStatus {
  NEW = "new",
  IN_PROGRESS = "in_progress",
  ON_HOLD = "on_hold",
  COMPLETED = "completed",
  CANCELLED = "cancelled"
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
 * Rechnungsstatus
 */
export enum InvoiceStatus {
  DRAFT = "draft",
  OPEN = "open",
  PAID = "paid",
  CANCELLED = "cancelled",
  OVERDUE = "overdue"
}
