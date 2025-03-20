import { Request, Response, NextFunction } from 'express';
export declare const validateCustomer: (req: Request, res: Response, next: NextFunction) => void;
export declare const validateProject: (req: Request, res: Response, next: NextFunction) => void;
export declare const validateAppointment: (req: Request, res: Response, next: NextFunction) => void;
export declare const validateService: (req: Request, res: Response, next: NextFunction) => void;
export declare const validateStatusUpdate: (req: Request, res: Response, next: NextFunction) => void;
export declare const validateContactForm: (req: Request, res: Response, next: NextFunction) => void;
declare const _default: {
    validateCustomer: (req: Request, res: Response, next: NextFunction) => void;
    validateProject: (req: Request, res: Response, next: NextFunction) => void;
    validateAppointment: (req: Request, res: Response, next: NextFunction) => void;
    validateService: (req: Request, res: Response, next: NextFunction) => void;
    validateStatusUpdate: (req: Request, res: Response, next: NextFunction) => void;
    validateContactForm: (req: Request, res: Response, next: NextFunction) => void;
};
export default _default;
