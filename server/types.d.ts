export { };

declare global {
    type SocketSharedState = {
        boardIdMap: Map<string, string>;
    }
}

declare module 'express' {
    interface Request {
        user?: {
            userId: string;
            username: string;
            refreshTokenVersion?: number;
        };
        file?: Express.Multer.File;
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
