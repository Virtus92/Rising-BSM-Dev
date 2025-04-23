import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Hilfsfunktion zum Zusammenführen von Tailwind-CSS-Klassen
 * 
 * Diese Funktion ist eine Kombination von clsx und tailwind-merge, die
 * es ermöglicht, bedingte Klassen zu definieren und dabei Konflikte
 * automatisch aufzulösen.
 * 
 * @param inputs - CSS-Klassen oder bedingte Objekte mit Klassen
 * @returns Zusammengeführte und bereinigte Klassen-String
 * 
 * @example
 * // Grundlegende Verwendung
 * cn('text-red-500', 'bg-blue-500')
 * 
 * // Mit bedingten Klassen
 * cn('text-red-500', isActive && 'font-bold', { 'p-4': hasPadding })
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
