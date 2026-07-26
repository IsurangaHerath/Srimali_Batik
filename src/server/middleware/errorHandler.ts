import type { Request, Response, NextFunction } from 'express';

export interface ApiError extends Error {
    status?: number;
    details?: string;
}

export function errorHandler(
    err: ApiError,
    _req: Request,
    res: Response,
    _next: NextFunction
): void {
    const status = err.status ?? 500;
    res.status(status).json({
        error: err.message ?? 'Internal server error',
        details: err.details ?? (process.env.NODE_ENV === 'development' ? err.stack : undefined),
    });
}

export function notFoundHandler(req: Request, _res: Response, next: NextFunction): void {
    const err: ApiError = new Error(`Cannot ${req.method} ${req.path}`);
    err.status = 404;
    next(err);
}
