export { };

declare global {
    type UserPayload = {
        userId: string;
        username: string;
        refreshTokenVersion?: number;
    }
}

/**
 * Extends Express Request to include user property
 */
declare module 'express' {
    interface Request {
        user?: UserPayload;
    }
}
