/**
 * Base-Repository-Klasse
 * 
 * Abstrakte Basisklasse für alle Repository-Implementierungen.
 * Implementiert die grundlegenden CRUD-Operationen und definiert
 * die gemeinsame Schnittstelle für alle Repositories.
 */

import { Prisma, PrismaClient } from '@prisma/client';
import { prisma } from '../db/prisma';

// Interface für Query-Optionen
export interface QueryOptions {
  include?: Record<string, any>;
  select?: Record<string, any>;
  where?: Record<string, any>;
  orderBy?: Record<string, any> | Array<Record<string, any>>;
  take?: number;
  skip?: number;
}

// Repository-Interface
export interface IRepository<T, ID> {
  findAll(options?: QueryOptions): Promise<T[]>;
  findById(id: ID, options?: QueryOptions): Promise<T | null>;
  findOne(options: QueryOptions): Promise<T | null>;
  count(options?: QueryOptions): Promise<number>;
  create(data: Partial<T>): Promise<T>;
  createMany(data: Partial<T>[]): Promise<Prisma.BatchPayload>;
  update(id: ID, data: Partial<T>): Promise<T>;
  updateMany(ids: ID[], data: Partial<T>): Promise<Prisma.BatchPayload>;
  delete(id: ID): Promise<boolean>;
  deleteMany(ids: ID[]): Promise<Prisma.BatchPayload>;
  transaction<R>(
    callback: (tx: PrismaClient) => Promise<R>
  ): Promise<R>;
}

// Abstrakte Basisklasse für Repositories
export abstract class BaseRepository<T, ID> implements IRepository<T, ID> {
  // Abstrakte Eigenschaften, die in abgeleiteten Klassen implementiert werden müssen
  protected abstract readonly modelName: string;
  protected abstract readonly idField: string;
  
  // Methode zur Konvertierung von Entity zu Domänenmodell
  protected abstract mapToDomainEntity(entity: any): T;
  
  /**
   * Konstruktor
   */
  constructor(
    protected readonly db: PrismaClient = prisma
  ) {}

  /**
   * Hilfsmethode zum Zugriff auf das entsprechende Prisma-Modell
   */
  protected get