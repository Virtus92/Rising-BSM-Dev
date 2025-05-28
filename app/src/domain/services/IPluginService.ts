import { IBaseService } from './IBaseService';
import { Plugin } from '../entities/Plugin';
import { 
  PluginDto, 
  CreatePluginDto, 
  UpdatePluginDto, 
  PluginSearchDto 
} from '../dtos/PluginDtos';

export interface IPluginService extends IBaseService<Plugin, CreatePluginDto, UpdatePluginDto, PluginDto> {
  createPlugin(data: CreatePluginDto, authorId: number): Promise<PluginDto>;
  updatePlugin(id: number, data: UpdatePluginDto, userId: number): Promise<PluginDto>;
  submitForReview(pluginId: number, userId: number): Promise<void>;
  approvePlugin(pluginId: number, reviewerId: number): Promise<void>;
  rejectPlugin(pluginId: number, reviewerId: number, reason: string): Promise<void>;
  suspendPlugin(pluginId: number, reviewerId: number, reason: string): Promise<void>;
  searchPlugins(criteria: PluginSearchDto): Promise<{ data: PluginDto[]; total: number }>;
  getPluginByName(name: string): Promise<PluginDto | null>;
  getPluginByUuid(uuid: string): Promise<PluginDto | null>;
  getPluginsByAuthor(authorId: number): Promise<PluginDto[]>;
  getPluginsByCategory(category: string): Promise<PluginDto[]>;
  getCategories(): Promise<string[]>;
  getTags(): Promise<string[]>;
  incrementDownloads(pluginId: number): Promise<void>;
  uploadPluginBundle(pluginId: number, bundle: Buffer, userId: number): Promise<string>;
  generateSignature(pluginId: number, privateKey: string): Promise<string>;
  verifySignature(pluginId: number, signature: string): Promise<boolean>;
}