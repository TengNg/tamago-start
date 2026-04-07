export { };

import { JwtPayload } from "jsonwebtoken";

declare global {
    type SocketSharedState = {
        boardIdMap: Map<string, string>;
    }

    interface AuthJwtPayload extends JwtPayload {
        userId: string;
        username: string;
        refreshTokenVersion: number;
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
