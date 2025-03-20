import { Decimal } from '@prisma/client/runtime/library';

/**
 * Konvertiert Decimal zu number sicher
 */
export function toNumber(value: Decimal | number | null | undefined): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return value;
  return Number(value.toString());
}

/**
 * Behandelt nullable Werte mit Standardwert
 */
export function withDefault<T>(value: T | null | undefined, defaultValue: T): T {
  return value === null || value === undefined ? defaultValue : value;
}

/**
 * Behandelt nullable Datum sicher
 */
export function safeDate(date: Date | null | undefined): Date {
  return date || new Date();
}

/**
 * Typkonvertierung für .map() Funktionen
 */
export function typeSafeMap<T, R>(items: any[], mapFn: (item: T) => R): R[] {
  return (items as T[]).map(mapFn);
}

/**
 * Sicheres Decimal-to-Number Casting für Arrays von Prisma-Objekten
 */
export function castPrismaResults<T>(results: any[]): T[] {
  return results as unknown as T[];
}