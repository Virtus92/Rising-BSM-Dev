import { IBaseRepository } from './IBaseRepository';
import { Plugin } from '../entities/Plugin';

export interface IPluginRepository extends IBaseRepository<Plugin> {
  findByName(name: string): Promise<Plugin | null>;
  findByAuthor(authorId: number): Promise<Plugin[]>;
  findByCategory(category: string): Promise<Plugin[]>;
  findByStatus(status: string): Promise<Plugin[]>;
  updateInstallCount(pluginId: number, increment: number): Promise<void>;
  updateRevenue(pluginId: number, amount: number): Promise<void>;
  updateRating(pluginId: number, rating: number, reviewCount: number): Promise<void>;
  
  // Additional methods
  findByUuid(uuid: string): Promise<Plugin | null>;
  search(criteria: any): Promise<{ data: Plugin[]; total: number }>;
  getCategories(): Promise<string[]>;
  getTags(): Promise<string[]>;
  incrementDownloads(id: number): Promise<void>;
  findApproved(): Promise<Plugin[]>;
}