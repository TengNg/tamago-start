import { SOCKET_EVENTS } from '../../../shared/socket-events.js';
import {
    validate,
    sanitize,
    log,
    SCHEMAS,
    ATTACHMENT_FIELDS,
} from '../validate.js';

export default function registerCardAttachmentHandlers(socket) {

    socket.on(SOCKET_EVENTS.ATTACHMENT_CREATE, (data) => {
        const boardId = socket.boardId;
        if (!boardId) {
            log(`ATTACHMENT_CREATE: no boardId (socket=${socket.id})`);
            return;
        }
        if (!validate(data, SCHEMAS.ATTACHMENT_CREATE)) {
            log(`ATTACHMENT_CREATE: invalid payload (socket=${socket.id})`);
            return;
        }
        if (!data.attachment || typeof data.attachment !== 'object') {
            log(`ATTACHMENT_CREATE: invalid attachment (socket=${socket.id})`);
            return;
        }

        const sanitized = sanitize(data.attachment, ATTACHMENT_FIELDS);
        if (!sanitized) return;

        socket.to(boardId).emit(SOCKET_EVENTS.ATTACHMENT_CREATED, { attachment: sanitized });
    });

    socket.on(SOCKET_EVENTS.ATTACHMENT_DELETE, (data) => {
        const boardId = socket.boardId;
        if (!boardId) {
            log(`ATTACHMENT_DELETE: no boardId (socket=${socket.id})`);
            return;
        }
        if (!validate(data, SCHEMAS.ATTACHMENT_DELETE)) {
            log(`ATTACHMENT_DELETE: invalid payload (socket=${socket.id})`);
            return;
        }
        socket.to(boardId).emit(SOCKET_EVENTS.ATTACHMENT_DELETED, {
            id: data.id,
            cardId: data.cardId,
        });
    });
}
