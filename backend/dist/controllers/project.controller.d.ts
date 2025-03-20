import { Request, Response } from 'express';
export declare const getAllProjects: (req: Request, res: Response, next: import("express").NextFunction) => void;
export declare const getProjectById: (req: Request, res: Response, next: import("express").NextFunction) => void;
export declare const createProject: (req: Request, res: Response, next: import("express").NextFunction) => void;
export declare const updateProject: (req: Request, res: Response, next: import("express").NextFunction) => void;
export declare const updateProjectStatus: (req: Request, res: Response, next: import("express").NextFunction) => void;
export declare const addProjectNote: (req: Request, res: Response, next: import("express").NextFunction) => void;
export declare const exportProjects: (req: Request, res: Response, next: import("express").NextFunction) => void;
