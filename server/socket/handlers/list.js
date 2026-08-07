import BoardMembership from '../../models/BoardMembership.js';
import { SOCKET_EVENTS } from '../../../shared/socket-events.js';
import {
    allowedFields,
    validate,
    sanitize,
    log,
    SCHEMAS,
    LIST_FIELDS,
    CARD_FIELDS,
} from '../validate.js';

const LIST_UPDATE_ALLOWED = ['id', 'field', 'value'];

/**
 * @param {import('socket.io').Socket} socket
 */
export default function registerListHandlers(socket) {

    socket.on(SOCKET_EVENTS.LIST_UPDATE_ALL, (data) => {
        const boardId = socket.boardId;
        if (!boardId) {
            log(`LIST_UPDATE_ALL: no boardId (socket=${socket.id})`);
            return;
        }
        if (!Array.isArray(data)) {
            log(`LIST_UPDATE_ALL: invalid payload (socket=${socket.id})`);
            return;
        }
        const sanitized = data.map((item) => sanitize(item, LIST_FIELDS)).filter(Boolean);
        socket.to(boardId).emit(SOCKET_EVENTS.LIST_UPDATED_ALL, sanitized);
    });

    socket.on(SOCKET_EVENTS.LIST_MOVE, (data) => {
        const boardId = socket.boardId;
        if (!boardId) {
            log(`LIST_MOVE: no boardId (socket=${socket.id})`);
            return;
        }
        if (!validate(data, SCHEMAS.LIST_MOVE)) {
            log(`LIST_MOVE: invalid payload (socket=${socket.id})`);
            return;
        }
        socket.to(boardId).emit(SOCKET_EVENTS.LIST_MOVED, {
            id: data.id,
            fromIndex: data.fromIndex,
            toIndex: data.toIndex,
        });
    });

    socket.on(SOCKET_EVENTS.LIST_MOVE_TO_BOARD, async (data) => {
        try {
            const { boardId: targetBoardId, list, cards, index } = data;
            const sourceBoardId = socket.boardId;
            if (!sourceBoardId) {
                log(`LIST_MOVE_TO_BOARD: no boardId (socket=${socket.id})`);
                return;
            }
            if (!validate(data, SCHEMAS.LIST_MOVE_TO_BOARD)) {
                log(`LIST_MOVE_TO_BOARD: invalid payload (socket=${socket.id})`);
                return;
            }

            const membership = await BoardMembership.findOne({
                boardId: targetBoardId,
                userId: socket.user.id,
            });
            if (!membership) {
                log(`LIST_MOVE_TO_BOARD: no membership (socket=${socket.id}, board=${targetBoardId})`);
                return;
            }

            const sanitizedList = sanitize(list, LIST_FIELDS);
            const sanitizedCards = Array.isArray(cards)
                ? cards.map((c) => sanitize(c, CARD_FIELDS)).filter(Boolean)
                : [];
            socket.to(targetBoardId).emit(SOCKET_EVENTS.LIST_MOVED_TO_BOARD, {
                list: sanitizedList,
                cards: sanitizedCards,
                index,
            });
        } catch (err) {
            log(`LIST_MOVE_TO_BOARD: error=${err.message} (socket=${socket.id})`);
        }
    });

    socket.on(SOCKET_EVENTS.LIST_CREATE, (data) => {
        const boardId = socket.boardId;
        if (!boardId) {
            log(`LIST_CREATE: no boardId (socket=${socket.id})`);
            return;
        }
        if (!validate(data, SCHEMAS.LIST_CREATE)) {
            log(`LIST_CREATE: invalid payload (socket=${socket.id})`);
            return;
        }
        socket.to(boardId).emit(SOCKET_EVENTS.LIST_CREATED, sanitize(data, LIST_FIELDS));
    });

    socket.on(SOCKET_EVENTS.LIST_DELETE, (data) => {
        const boardId = socket.boardId;
        if (!boardId) {
            log(`LIST_DELETE: no boardId (socket=${socket.id})`);
            return;
        }
        if (!validate(data, SCHEMAS.LIST_DELETE)) {
            log(`LIST_DELETE: invalid payload (socket=${socket.id})`);
            return;
        }
        socket.to(boardId).emit(SOCKET_EVENTS.LIST_DELETED, { id: data.id });
    });

    socket.on(SOCKET_EVENTS.LIST_UPDATE, (data) => {
        const boardId = socket.boardId;
        if (!boardId) {
            log(`LIST_UPDATE: no boardId (socket=${socket.id})`);
            return;
        }
        if (!allowedFields(data, LIST_UPDATE_ALLOWED)) {
            log(`LIST_UPDATE: invalid fields (socket=${socket.id})`);
            return;
        }
        socket.to(boardId).emit(SOCKET_EVENTS.LIST_UPDATED, {
            id: data.id,
            field: data.field,
            value: data.value,
        });
    });
}
