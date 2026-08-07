import { SOCKET_EVENTS } from '../../../shared/socket-events.js';
import {
    validate,
    sanitize,
    log,
    SCHEMAS,
    COMMENT_FIELDS,
} from '../validate.js';

export default function registerCardCommentHandlers(socket) {

    socket.on(SOCKET_EVENTS.COMMENT_CREATE, (data) => {
        const boardId = socket.boardId;
        if (!boardId) {
            log(`COMMENT_CREATE: no boardId (socket=${socket.id})`);
            return;
        }
        if (!validate(data, SCHEMAS.COMMENT_CREATE)) {
            log(`COMMENT_CREATE: invalid payload (socket=${socket.id})`);
            return;
        }
        if (!data.comment || typeof data.comment !== 'object') {
            log(`COMMENT_CREATE: invalid comment (socket=${socket.id})`);
            return;
        }

        const sanitized = sanitize(data.comment, COMMENT_FIELDS);
        if (!sanitized) return;

        socket.to(boardId).emit(SOCKET_EVENTS.COMMENT_CREATED, { comment: sanitized });
    });

    socket.on(SOCKET_EVENTS.COMMENT_DELETE, (data) => {
        const boardId = socket.boardId;
        if (!boardId) {
            log(`COMMENT_DELETE: no boardId (socket=${socket.id})`);
            return;
        }
        if (!validate(data, SCHEMAS.COMMENT_DELETE)) {
            log(`COMMENT_DELETE: invalid payload (socket=${socket.id})`);
            return;
        }
        socket.to(boardId).emit(SOCKET_EVENTS.COMMENT_DELETED, {
            commentId: data.commentId,
            cardId: data.cardId,
        });
    });
}
