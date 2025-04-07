/**
 * Common status enumeration
 * Used for various entities in the system
 */
export enum CommonStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
  DELETED = "deleted"
}

/**
 * Project status enumeration
 * Aligned with Prisma schema
 */
export enum ProjectStatus {
  NEW = "new",
  IN_PROGRESS = "in_progress",
  ON_HOLD = "on_hold",
  COMPLETED = "completed",
  CANCELLED = "cancelled"
}

/**
 * Appointment status enumeration
 * Aligned with Prisma schema
 */
export enum AppointmentStatus {
  PLANNED = "planned",
  CONFIRMED = "confirmed",
  CANCELLED = "cancelled",
  COMPLETED = "completed",
  RESCHEDULED = "rescheduled"
}

/**
 * Invoice status enumeration
 * Aligned with Prisma schema
 */
export enum InvoiceStatus {
  DRAFT = "draft",
  OPEN = "open",
  PAID = "paid",
  CANCELLED = "cancelled",
  OVERDUE = "overdue"
}

/**
 * Contact request status enumeration
 * Aligned with Prisma schema
 */
export enum ContactRequestStatus {
  NEW = "new",
  IN_PROGRESS = "in_progress",
  COMPLETED = "completed",
  SPAM = "spam"
}

/**
 * Customer type enumeration
 * Aligned with Prisma schema
 */
export enum CustomerType {
  PRIVATE = "private",
  BUSINESS = "business"
}
