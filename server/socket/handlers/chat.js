import { SOCKET_EVENTS } from '../../../shared/socket-events.js';
import {
    validate,
    sanitize,
    log,
    SCHEMAS,
    CHAT_MESSAGE_FIELDS,
} from '../validate.js';

export default function registerChatHandlers(socket) {

    socket.on(SOCKET_EVENTS.CHAT_SEND, (data) => {
        const boardId = socket.boardId;
        if (!boardId) {
            log(`CHAT_SEND: no boardId (socket=${socket.id})`);
            return;
        }
        if (!validate(data, SCHEMAS.CHAT_SEND)) {
            log(`CHAT_SEND: invalid payload (socket=${socket.id})`);
            return;
        }
        if (!data.chatMessage || typeof data.chatMessage !== 'object') {
            log(`CHAT_SEND: invalid chatMessage (socket=${socket.id})`);
            return;
        }

        const sanitized = sanitize(data.chatMessage, CHAT_MESSAGE_FIELDS);
        if (!sanitized) return;

        // Force sentBy from authenticated socket — prevent spoofing
        sanitized.sentBy = {
            _id: socket.user.id,
            username: socket.user.username,
        };

        socket.to(boardId).emit(SOCKET_EVENTS.CHAT_RECEIVED, { chatMessage: sanitized });
    });

    socket.on(SOCKET_EVENTS.CHAT_DELETE, (data) => {
        const boardId = socket.boardId;
        if (!boardId) {
            log(`CHAT_DELETE: no boardId (socket=${socket.id})`);
            return;
        }
        if (!validate(data, SCHEMAS.CHAT_DELETE)) {
            log(`CHAT_DELETE: invalid payload (socket=${socket.id})`);
            return;
        }
        socket.to(boardId).emit(SOCKET_EVENTS.CHAT_DELETED, { id: data.id });
    });

    socket.on(SOCKET_EVENTS.CHAT_CLEAR, (_) => {
        const boardId = socket.boardId;
        if (!boardId) {
            log(`CHAT_CLEAR: no boardId (socket=${socket.id})`);
            return;
        }
        socket.to(boardId).emit(SOCKET_EVENTS.CHAT_CLEARED);
    });
}
