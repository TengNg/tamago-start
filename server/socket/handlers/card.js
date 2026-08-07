import { SOCKET_EVENTS } from '../../../shared/socket-events.js';
import {
    allowedFields,
    validate,
    sanitize,
    log,
    SCHEMAS,
    CARD_FIELDS,
} from '../validate.js';

const CARD_UPDATE_ALLOWED = ['id', 'listId', 'field', 'value'];

/**
 * @param {import('socket.io').Socket} socket
 */
export default function registerCardHandlers(socket) {

    socket.on(SOCKET_EVENTS.CARD_CREATE, (data) => {
        const boardId = socket.boardId;
        if (!boardId) {
            log(`CARD_CREATE: no boardId (socket=${socket.id})`);
            return;
        }

        if (!validate(data, SCHEMAS.CARD_CREATE)) {
            log(`CARD_CREATE: invalid payload (socket=${socket.id})`);
            return;
        }

        socket.to(boardId).emit(SOCKET_EVENTS.CARD_CREATED, sanitize(data, CARD_FIELDS));
    });

    socket.on(SOCKET_EVENTS.CARD_DELETE, (data) => {
        const boardId = socket.boardId;
        if (!boardId) {
            log(`CARD_DELETE: no boardId (socket=${socket.id})`);
            return;
        }

        if (!validate(data, SCHEMAS.CARD_DELETE)) {
            log(`CARD_DELETE: invalid payload (socket=${socket.id})`);
            return;
        }

        socket.to(boardId).emit(SOCKET_EVENTS.CARD_DELETED, {
            listId: data.listId,
            id: data.id,
        });
    });

    socket.on(SOCKET_EVENTS.CARD_COPY, (data) => {
        const boardId = socket.boardId;
        if (!boardId) {
            log(`CARD_COPY: no boardId (socket=${socket.id})`);
            return;
        }

        if (!validate(data, SCHEMAS.CARD_COPY)) {
            log(`CARD_COPY: invalid payload (socket=${socket.id})`);
            return;
        }

        socket.to(boardId).emit(SOCKET_EVENTS.CARD_COPIED, {
            card: sanitize(data.card, CARD_FIELDS),
            index: data.index,
        });
    });

    socket.on(SOCKET_EVENTS.CARD_MOVE, (data) => {
        const boardId = socket.boardId;
        if (!boardId) {
            log(`CARD_MOVE: no boardId (socket=${socket.id})`);
            return;
        }

        if (!validate(data, SCHEMAS.CARD_MOVE)) {
            log(`CARD_MOVE: invalid payload (socket=${socket.id})`);
            return;
        }

        socket.to(boardId).emit(SOCKET_EVENTS.CARD_MOVED, {
            oldListId: data.oldListId,
            newListId: data.newListId,
            id: data.id,
            newCard: sanitize(data.newCard, CARD_FIELDS),
        });
    });

    socket.on(SOCKET_EVENTS.CARD_MOVE_BY_INDEX, (data) => {
        const boardId = socket.boardId;
        if (!boardId) {
            log(`CARD_MOVE_BY_INDEX: no boardId (socket=${socket.id})`);
            return;
        }

        if (!validate(data, SCHEMAS.CARD_MOVE_BY_INDEX)) {
            log(`CARD_MOVE_BY_INDEX: invalid payload (socket=${socket.id})`);
            return;
        }

        const sanitizedCards = data.cards.map((c) => sanitize(c, CARD_FIELDS)).filter(Boolean);
        socket.to(boardId).emit(SOCKET_EVENTS.CARD_MOVED_BY_INDEX, {
            cards: sanitizedCards,
            listId: data.listId,
        });
    });

    socket.on(SOCKET_EVENTS.CARD_MOVE_TO_LIST, (data) => {
        const boardId = socket.boardId;
        if (!boardId) {
            log(`CARD_MOVE_TO_LIST: no boardId (socket=${socket.id})`);
            return;
        }

        if (!validate(data, SCHEMAS.CARD_MOVE_TO_LIST)) {
            log(`CARD_MOVE_TO_LIST: invalid payload (socket=${socket.id})`);
            return;
        }

        socket.to(boardId).emit(SOCKET_EVENTS.CARD_MOVED_TO_LIST, {
            oldListId: data.oldListId,
            newListId: data.newListId,
            insertedIndex: data.insertedIndex,
            card: sanitize(data.card, CARD_FIELDS),
        });
    });

    socket.on(SOCKET_EVENTS.CARD_UPDATE, (data) => {
        const boardId = socket.boardId;
        if (!boardId) {
            log(`CARD_UPDATE: no boardId (socket=${socket.id})`);
            return;
        }

        if (!allowedFields(data, CARD_UPDATE_ALLOWED)) {
            log(`CARD_UPDATE: invalid fields (socket=${socket.id})`);
            return;
        }

        socket.to(boardId).emit(SOCKET_EVENTS.CARD_UPDATED, {
            id: data.id,
            listId: data.listId,
            field: data.field,
            value: data.value,
        });
    });
}
