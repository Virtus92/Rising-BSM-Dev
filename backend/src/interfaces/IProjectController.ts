/**
 * IProjectController
 * 
 * Interface for project controller.
 * Defines methods for handling project-related HTTP requests.
 */
import { Request, Response } from 'express';
import { IBaseController } from './IBaseController.js';
import { Project } from '../entities/Project.js';

export interface IProjectController extends IBaseController<Project> {
  /**
   * Get all projects with pagination and filtering
   * 
   * @param req - HTTP request
   * @param res - HTTP response
   */
  getAllProjects(req: Request, res: Response): Promise<void>;
  
  /**
   * Get project by ID
   * 
   * @param req - HTTP request
   * @param res - HTTP response
   */
  getProjectById(req: Request, res: Response): Promise<void>;
  
  /**
   * Create a new project
   * 
   * @param req - HTTP request
   * @param res - HTTP response
   */
  createProject(req: Request, res: Response): Promise<void>;
  
  /**
   * Update an existing project
   * 
   * @param req - HTTP request
   * @param res - HTTP response
   */
  updateProject(req: Request, res: Response): Promise<void>;
  
  /**
   * Delete a project
   * 
   * @param req - HTTP request
   * @param res - HTTP response
   */
  deleteProject(req: Request, res: Response): Promise<void>;
  
  /**
   * Update project status
   * 
   * @param req - HTTP request
   * @param res - HTTP response
   */
  updateProjectStatus(req: Request, res: Response): Promise<void>;
  
  /**
   * Get projects by customer
   * 
   * @param req - HTTP request
   * @param res - HTTP response
   */
  getProjectsByCustomer(req: Request, res: Response): Promise<void>;
  
  /**
   * Get projects by service
   * 
   * @param req - HTTP request
   * @param res - HTTP response
   */
  getProjectsByService(req: Request, res: Response): Promise<void>;
  
  /**
   * Get active projects
   * 
   * @param req - HTTP request
   * @param res - HTTP response
   */
  getActiveProjects(req: Request, res: Response): Promise<void>;
  
  /**
   * Get project statistics
   * 
   * @param req - HTTP request
   * @param res - HTTP response
   */
  getProjectStatistics(req: Request, res: Response): Promise<void>;
  
  /**
   * Add note to project
   * 
   * @param req - HTTP request
   * @param res - HTTP response
   */
  addProjectNote(req: Request, res: Response): Promise<void>;
  
  /**
   * Get project notes
   * 
   * @param req - HTTP request
   * @param res - HTTP response
   */
  getProjectNotes(req: Request, res: Response): Promise<void>;
  
  /**
   * Search projects
   * 
   * @param req - HTTP request
   * @param res - HTTP response
   */
  searchProjects(req: Request, res: Response): Promise<void>;
  
  /**
   * Export projects
   * 
   * @param req - HTTP request
   * @param res - HTTP response
   */
  exportProjects(req: Request, res: Response): Promise<void>;
}
