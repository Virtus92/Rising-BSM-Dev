import { Request, Response } from 'express';
/**
 * Get all projects with optional filtering
 */
export declare const getAllProjects: (req: Request, res: Response, next: import("express").NextFunction) => void;
/**
 * Get project by ID with related data
 */
export declare const getProjectById: (req: Request, res: Response, next: import("express").NextFunction) => void;
/**
 * Create a new project
 */
export declare const createProject: (req: Request, res: Response, next: import("express").NextFunction) => void;
/**
 * Update an existing project
 */
export declare const updateProject: (req: Request, res: Response, next: import("express").NextFunction) => void;
/**
 * Update project status
 */
export declare const updateProjectStatus: (req: Request, res: Response, next: import("express").NextFunction) => void;
/**
 * Add a note to project
 */
export declare const addProjectNote: (req: Request, res: Response, next: import("express").NextFunction) => void;
/**
 * Export projects data
 */
export declare const exportProjects: (req: Request, res: Response, next: import("express").NextFunction) => void;
