declare global {
    namespace Express {
        interface Request {
            csrfToken(): string;
        }
    }
}
declare const router: import("express-serve-static-core").Router;
export default router;
