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

declare module "socket.io" {
  interface Socket {
    user?: {
      id: string;
      username: string;
    };
  }
}
