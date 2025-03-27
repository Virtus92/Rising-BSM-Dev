import { Request, Response } from 'express';
import { IRoleController } from '../interfaces/IRoleController.js';
import { IRoleService } from '../interfaces/IRoleService.js';
import { ILoggingService } from '../interfaces/ILoggingService.js';
import { IErrorHandler } from '../interfaces/IErrorHandler.js';
import { 
  RoleCreateDto, 
  RoleUpdateDto, 
  PermissionAssignmentDto 
} from '../dtos/RoleDtos.js';
import { AuthenticatedRequest } from '../interfaces/IAuthTypes.js';
import { Permission } from '../entities/Permission.js';

/**
 * Implementation of IRoleController
 */
export class RoleController implements IRoleController {
  /**
   * Creates a new RoleController instance
   * 
   * @param roleService - Role service
   * @param logger - Logging service
   * @param errorHandler - Error handler
   */
  constructor(
    private readonly roleService: IRoleService,
    private readonly logger: ILoggingService,
    private readonly errorHandler: IErrorHandler
  ) {
    this.logger.debug('Initialized RoleController');
  }

  /**
   * Get all roles
   * 
   * @param req - HTTP request
   * @param res - HTTP response
   */
  public async getAllRoles(req: Request, res: Response): Promise<void> {
    try {
      // Extract pagination parameters
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      
      // Get roles from service
      const result = await this.roleService.getAll({
        page,
        limit
      });
      
      // Send paginated response
      this.sendPaginatedResponse(res, result.data, result.pagination, 'Roles retrieved successfully');
    } catch (error) {
      this.handleError(error, req, res);
    }
  }

  /**
   * Get role by ID
   * 
   * @param req - HTTP request
   * @param res - HTTP response
   */
  public async getRoleById(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      
      // Get detailed role data with permissions
      const role = await this.roleService.getRoleDetails(id);
      
      if (!role) {
        throw this.errorHandler.createNotFoundError(`Role with ID ${id} not found`);
      }
      
      // Send success response
      this.sendSuccessResponse(res, role, 'Role retrieved successfully');
    } catch (error) {
      this.handleError(error, req, res);
    }
  }

  /**
   * Create a new role
   * 
   * @param req - HTTP request
   * @param res - HTTP response
   */
  public async createRole(req: Request, res: Response): Promise<void> {
    try {
      const roleData = (req as any).validatedData as RoleCreateDto || req.body;
      const authReq = req as AuthenticatedRequest;
      
      // Create role
      const role = await this.roleService.create(roleData, {
        context: {
          userId: authReq.user?.id,
          ipAddress: req.ip
        }
      });
      
      // Send created response
      this.sendCreatedResponse(res, role, 'Role created successfully');
    } catch (error) {
      this.handleError(error, req, res);
    }
  }

  /**
   * Update an existing role
   * 
   * @param req - HTTP request
   * @param res - HTTP response
   */
  public async updateRole(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      const roleData = (req as any).validatedData as RoleUpdateDto || req.body;
      const authReq = req as AuthenticatedRequest;
      
      // Update role
      const role = await this.roleService.update(id, roleData, {
        context: {
          userId: authReq.user?.id,
          ipAddress: req.ip
        }
      });
      
      // Send success response
      this.sendSuccessResponse(res, role, 'Role updated successfully');
    } catch (error) {
      this.handleError(error, req, res);
    }
  }

  /**
   * Delete a role
   * 
   * @param req - HTTP request
   * @param res - HTTP response
   */
  public async deleteRole(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      const authReq = req as AuthenticatedRequest;
      
      // Delete role
      const result = await this.roleService.delete(id, {
        context: {
          userId: authReq.user?.id,
          ipAddress: req.ip
        }
      });
      
      // Send success response
      this.sendSuccessResponse(
        res,
        { success: result, id },
        'Role deleted successfully'
      );
    } catch (error) {
      this.handleError(error, req, res);
    }
  }

  /**
   * Get all permissions
   * 
   * @param req - HTTP request
   * @param res - HTTP response
   */
  public async getAllPermissions(req: Request, res: Response): Promise<void> {
    try {
      const category = req.query.category as string;
      
      let permissions: Permission[];
      
      if (category) {
        // Get permissions by category
        permissions = await this.roleService.getPermissionsByCategory(category);
      } else {
        // Get all permissions
        permissions = await this.roleService.getAllPermissions();
      }
      
      // Send success response
      this.sendSuccessResponse(res, permissions, 'Permissions retrieved successfully');
    } catch (error) {
      this.handleError(error, req, res);
    }
  }

  /**
   * Assign permissions to a role
   * 
   * @param req - HTTP request
   * @param res - HTTP response
   */
  public async assignPermissions(req: Request, res: Response): Promise<void> {
    try {
      const roleId = parseInt(req.params.id, 10);
      const permissionData = (req as any).validatedData as PermissionAssignmentDto || req.body;
      const authReq = req as AuthenticatedRequest;
      
      // Assign permissions
      const updatedRole = await this.roleService.assignPermissions(roleId, permissionData, {
        context: {
          userId: authReq.user?.id,
          ipAddress: req.ip
        }
      });
      
      // Send success response
      this.sendSuccessResponse(res, updatedRole, 'Permissions assigned successfully');
    } catch (error) {
      this.handleError(error, req, res);
    }
  }

  /**
   * Create a new permission
   * 
   * @param req - HTTP request
   * @param res - HTTP response
   */
  public async createPermission(req: Request, res: Response): Promise<void> {
    try {
      const permissionData = (req as any).validatedData || req.body;
      const authReq = req as AuthenticatedRequest;
      
      // Create permission
      const permission = await this.roleService.createPermission(permissionData, {
        context: {
          userId: authReq.user?.id,
          ipAddress: req.ip
        }
      });
      
      // Send created response
      this.sendCreatedResponse(res, permission, 'Permission created successfully');
    } catch (error) {
      this.handleError(error, req, res);
    }
  }

  /**
   * Send success response
   * 
   * @param res - HTTP response
   * @param data - Response data
   * @param message - Success message
   */
  private sendSuccessResponse(res: Response, data: any, message?: string): void {
    res.status(200).json({
      success: true,
      data,
      message: message || 'Operation successful'
    });
  }

  /**
   * Send created response
   * 
   * @param res - HTTP response
   * @param data - Response data
   * @param message - Success message
   */
  private sendCreatedResponse(res: Response, data: any, message?: string): void {
    res.status(201).json({
      success: true,
      data,
      message: message || 'Resource created successfully'
    });
  }

  /**
   * Send paginated response
   * 
   * @param res - HTTP response
   * @param data - Response data
   * @param pagination - Pagination information
   * @param message - Success message
   */
  private sendPaginatedResponse(res: Response, data: any[], pagination: any, message?: string): void {
    res.status(200).json({
      success: true,
      data,
      meta: {
        pagination
      },
      message: message || 'Operation successful'
    });
  }

  /**
   * Handle and format errors
   * 
   * @param error - Error object
   * @param req - HTTP request
   * @param res - HTTP response
   */
  private handleError(error: any, req: Request, res: Response): void {
    this.errorHandler.handleError(error, req, res);
  }
}