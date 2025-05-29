/**
 * API Client for plugin management
 */
import ApiClient, { ApiResponse, ApiRequestError } from '@/core/api/ApiClient';
import { PaginationResult } from '@/domain/repositories/IBaseRepository';
import { validateId } from '@/shared/utils/validation-utils';
import {
  PluginDto,
  PluginLicenseDto,
  PluginInstallationDto,
  CreatePluginDto,
  UpdatePluginDto,
  PluginSearchDto,
  VerifyLicenseDto,
  InstallPluginDto,
  GenerateLicenseDto,
  PluginExecutionDto,
  PluginBundleDto
} from '@/domain/dtos/PluginDtos';

// API base URLs
const PLUGINS_API_URL = '/api/plugins';
const LICENSES_API_URL = '/api/plugins/licenses';
const INSTALLATIONS_API_URL = '/api/plugins/installations';

/**
 * Client for plugin API requests
 */
export class PluginClient {
  // Plugin Management
  
  /**
   * Search plugins in the marketplace
   */
  static async searchPlugins(params: PluginSearchDto = {}): Promise<ApiResponse<PaginationResult<PluginDto>>> {
    try {
      const queryParams = new URLSearchParams();
      
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            value.forEach(item => queryParams.append(key, String(item)));
          } else {
            queryParams.append(key, String(value));
          }
        }
      });
      
      const queryString = queryParams.toString();
      const url = `${PLUGINS_API_URL}${queryString ? `?${queryString}` : ''}`;
      
      return await ApiClient.get(url);
    } catch (error) {
      throw new ApiRequestError(
        error instanceof Error ? error.message : 'Failed to search plugins',
        500
      );
    }
  }

  /**
   * Get plugin by ID
   */
  static async getPlugin(id: number | string): Promise<ApiResponse<PluginDto>> {
    try {
      const validatedId = validateId(id);
      if (validatedId === null) {
        throw new ApiRequestError('Invalid plugin ID format', 400);
      }
      
      return await ApiClient.get(`${PLUGINS_API_URL}/${validatedId}`);
    } catch (error) {
      throw new ApiRequestError(
        error instanceof Error ? error.message : `Failed to fetch plugin with ID ${id}`,
        500
      );
    }
  }

  /**
   * Create a new plugin
   */
  static async createPlugin(data: CreatePluginDto): Promise<ApiResponse<PluginDto>> {
    try {
      return await ApiClient.post(PLUGINS_API_URL, data);
    } catch (error) {
      throw new ApiRequestError(
        error instanceof Error ? error.message : 'Failed to create plugin',
        500
      );
    }
  }

  /**
   * Update a plugin
   */
  static async updatePlugin(id: number | string, data: UpdatePluginDto): Promise<ApiResponse<PluginDto>> {
    try {
      const validatedId = validateId(id);
      if (validatedId === null) {
        throw new ApiRequestError('Invalid plugin ID format', 400);
      }
      
      return await ApiClient.put(`${PLUGINS_API_URL}/${validatedId}`, data);
    } catch (error) {
      throw new ApiRequestError(
        error instanceof Error ? error.message : `Failed to update plugin with ID ${id}`,
        500
      );
    }
  }

  /**
   * Delete a plugin
   */
  static async deletePlugin(id: number | string): Promise<ApiResponse<void>> {
    try {
      const validatedId = validateId(id);
      if (validatedId === null) {
        throw new ApiRequestError('Invalid plugin ID format', 400);
      }
      
      return await ApiClient.delete(`${PLUGINS_API_URL}/${validatedId}`);
    } catch (error) {
      throw new ApiRequestError(
        error instanceof Error ? error.message : `Failed to delete plugin with ID ${id}`,
        500
      );
    }
  }

  /**
   * Approve a plugin for marketplace
   */
  static async approvePlugin(id: number | string): Promise<ApiResponse<PluginDto>> {
    try {
      const validatedId = validateId(id);
      if (validatedId === null) {
        throw new ApiRequestError('Invalid plugin ID format', 400);
      }
      
      return await ApiClient.post(`${PLUGINS_API_URL}/${validatedId}/approve`, {});
    } catch (error) {
      throw new ApiRequestError(
        error instanceof Error ? error.message : `Failed to approve plugin with ID ${id}`,
        500
      );
    }
  }

  /**
   * Reject a plugin
   */
  static async rejectPlugin(id: number | string, reason: string): Promise<ApiResponse<PluginDto>> {
    try {
      const validatedId = validateId(id);
      if (validatedId === null) {
        throw new ApiRequestError('Invalid plugin ID format', 400);
      }
      
      return await ApiClient.post(`${PLUGINS_API_URL}/${validatedId}/reject`, { reason });
    } catch (error) {
      throw new ApiRequestError(
        error instanceof Error ? error.message : `Failed to reject plugin with ID ${id}`,
        500
      );
    }
  }

  /**
   * Publish a plugin to marketplace
   */
  static async publishPlugin(id: number | string): Promise<ApiResponse<PluginDto>> {
    try {
      const validatedId = validateId(id);
      if (validatedId === null) {
        throw new ApiRequestError('Invalid plugin ID format', 400);
      }
      
      return await ApiClient.post(`${PLUGINS_API_URL}/${validatedId}/publish`, {});
    } catch (error) {
      throw new ApiRequestError(
        error instanceof Error ? error.message : `Failed to publish plugin with ID ${id}`,
        500
      );
    }
  }

  /**
   * Download plugin bundle
   */
  static async downloadPlugin(id: number | string, licenseKey: string): Promise<ApiResponse<PluginBundleDto>> {
    try {
      const validatedId = validateId(id);
      if (validatedId === null) {
        throw new ApiRequestError('Invalid plugin ID format', 400);
      }
      
      return await ApiClient.get(`${PLUGINS_API_URL}/${validatedId}/bundle`, {
        params: { licenseKey }
      });
    } catch (error) {
      throw new ApiRequestError(
        error instanceof Error ? error.message : `Failed to download plugin with ID ${id}`,
        500
      );
    }
  }

  // License Management

  /**
   * Get user's licenses
   */
  static async getUserLicenses(userId?: number): Promise<ApiResponse<PluginLicenseDto[]>> {
    try {
      const params = userId ? { userId } : {};
      return await ApiClient.get(LICENSES_API_URL, { params });
    } catch (error) {
      throw new ApiRequestError(
        error instanceof Error ? error.message : 'Failed to fetch licenses',
        500
      );
    }
  }

  /**
   * Generate a license for a plugin
   */
  static async generateLicense(data: GenerateLicenseDto): Promise<ApiResponse<PluginLicenseDto>> {
    try {
      return await ApiClient.post(LICENSES_API_URL, data);
    } catch (error) {
      throw new ApiRequestError(
        error instanceof Error ? error.message : 'Failed to generate license',
        500
      );
    }
  }

  /**
   * Verify a license
   */
  static async verifyLicense(data: VerifyLicenseDto): Promise<ApiResponse<{ valid: boolean; license?: PluginLicenseDto }>> {
    try {
      return await ApiClient.post(`${LICENSES_API_URL}/verify`, data);
    } catch (error) {
      throw new ApiRequestError(
        error instanceof Error ? error.message : 'Failed to verify license',
        500
      );
    }
  }

  /**
   * Revoke a license
   */
  static async revokeLicense(licenseKey: string, reason: string): Promise<ApiResponse<PluginLicenseDto>> {
    try {
      return await ApiClient.post(`${LICENSES_API_URL}/revoke`, { licenseKey, reason });
    } catch (error) {
      throw new ApiRequestError(
        error instanceof Error ? error.message : 'Failed to revoke license',
        500
      );
    }
  }

  /**
   * Transfer a license to another user
   */
  static async transferLicense(licenseKey: string, newUserId: number): Promise<ApiResponse<PluginLicenseDto>> {
    try {
      return await ApiClient.post(`${LICENSES_API_URL}/transfer`, { licenseKey, newUserId });
    } catch (error) {
      throw new ApiRequestError(
        error instanceof Error ? error.message : 'Failed to transfer license',
        500
      );
    }
  }

  // Installation Management

  /**
   * Get user's installations
   */
  static async getUserInstallations(userId?: number): Promise<ApiResponse<PluginInstallationDto[]>> {
    try {
      const params = userId ? { userId } : {};
      return await ApiClient.get(INSTALLATIONS_API_URL, { params });
    } catch (error) {
      throw new ApiRequestError(
        error instanceof Error ? error.message : 'Failed to fetch installations',
        500
      );
    }
  }

  /**
   * Install a plugin
   */
  static async installPlugin(data: InstallPluginDto): Promise<ApiResponse<PluginInstallationDto>> {
    try {
      return await ApiClient.post(INSTALLATIONS_API_URL, data);
    } catch (error) {
      throw new ApiRequestError(
        error instanceof Error ? error.message : 'Failed to install plugin',
        500
      );
    }
  }

  /**
   * Uninstall a plugin
   */
  static async uninstallPlugin(installationId: string): Promise<ApiResponse<void>> {
    try {
      return await ApiClient.delete(`${INSTALLATIONS_API_URL}/${installationId}`);
    } catch (error) {
      throw new ApiRequestError(
        error instanceof Error ? error.message : `Failed to uninstall plugin with installation ID ${installationId}`,
        500
      );
    }
  }

  /**
   * Update installation status
   */
  static async updateInstallationStatus(
    installationId: string, 
    status: 'active' | 'inactive'
  ): Promise<ApiResponse<PluginInstallationDto>> {
    try {
      return await ApiClient.put(`${INSTALLATIONS_API_URL}/${installationId}/status`, { status });
    } catch (error) {
      throw new ApiRequestError(
        error instanceof Error ? error.message : `Failed to update installation status`,
        500
      );
    }
  }

  /**
   * Send heartbeat for an installation
   */
  static async sendHeartbeat(installationId: string): Promise<ApiResponse<void>> {
    try {
      return await ApiClient.post(`${INSTALLATIONS_API_URL}/${installationId}/heartbeat`, {});
    } catch (error) {
      throw new ApiRequestError(
        error instanceof Error ? error.message : `Failed to send heartbeat`,
        500
      );
    }
  }

  /**
   * Get plugin execution history
   */
  static async getExecutionHistory(
    installationId: string,
    params?: { page?: number; limit?: number }
  ): Promise<ApiResponse<PaginationResult<PluginExecutionDto>>> {
    try {
      return await ApiClient.get(`${INSTALLATIONS_API_URL}/${installationId}/executions`, { params });
    } catch (error) {
      throw new ApiRequestError(
        error instanceof Error ? error.message : `Failed to fetch execution history`,
        500
      );
    }
  }

  // Plugin Statistics

  /**
   * Get plugin statistics
   */
  static async getPluginStats(pluginId: number | string): Promise<ApiResponse<any>> {
    try {
      const validatedId = validateId(pluginId);
      if (validatedId === null) {
        throw new ApiRequestError('Invalid plugin ID format', 400);
      }
      
      return await ApiClient.get(`${PLUGINS_API_URL}/${validatedId}/stats`);
    } catch (error) {
      throw new ApiRequestError(
        error instanceof Error ? error.message : `Failed to fetch plugin statistics`,
        500
      );
    }
  }

  /**
   * Get marketplace statistics
   */
  static async getMarketplaceStats(): Promise<ApiResponse<any>> {
    try {
      return await ApiClient.get(`${PLUGINS_API_URL}/stats`);
    } catch (error) {
      throw new ApiRequestError(
        error instanceof Error ? error.message : 'Failed to fetch marketplace statistics',
        500
      );
    }
  }

  /**
   * Get popular plugins
   */
  static async getPopularPlugins(limit: number = 10): Promise<ApiResponse<PluginDto[]>> {
    try {
      return await ApiClient.get(`${PLUGINS_API_URL}/popular`, { params: { limit } });
    } catch (error) {
      throw new ApiRequestError(
        error instanceof Error ? error.message : 'Failed to fetch popular plugins',
        500
      );
    }
  }

  /**
   * Get recommended plugins
   */
  static async getRecommendedPlugins(limit: number = 10): Promise<ApiResponse<PluginDto[]>> {
    try {
      return await ApiClient.get(`${PLUGINS_API_URL}/recommended`, { params: { limit } });
    } catch (error) {
      throw new ApiRequestError(
        error instanceof Error ? error.message : 'Failed to fetch recommended plugins',
        500
      );
    }
  }
}

export default PluginClient;