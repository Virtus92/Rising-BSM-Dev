/**
 * Zentraler Export der Datenbank-Funktionalität
 * Alle Datenbank-Zugriffe sollten über dieses Modul erfolgen.
 */
import prisma from './prisma';

// Direkte Prisma-Instance für Legacy-Code
export const db = prisma;

// Typen aus Prisma exportieren
export type * from '@prisma/client';

// PrismaClient exportieren
export default prisma;
