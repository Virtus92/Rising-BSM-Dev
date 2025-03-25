import { PrismaClient } from '@prisma/client';

declare module '@prisma/client' {
  export interface TransactionClient extends PrismaClient {}
}