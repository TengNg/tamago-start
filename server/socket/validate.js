import { Types } from 'mongoose';

const MAX_STRING_LEN = 500;
const MAX_ARRAY_LEN = 200;

/**
 * @param {string} msg
 * @returns {void}
 */
export function log(msg) {
    if (process.env.NODE_ENV === "development") {
        console.log("[socket] " + msg);
    }
}

/**
 * @param {unknown} v
 * @returns {boolean}
 */
export function isObjectId(v) {
    return typeof v === 'string' && Types.ObjectId.isValid(v);
}

/**
 * @param {unknown} v
 * @param {number} [max=MAX_STRING_LEN]
 * @returns {boolean}
 */
export function isShortString(v, max = MAX_STRING_LEN) {
    return typeof v === 'string' && v.length <= max;
}

/**
 * @param {unknown} v
 * @returns {boolean}
 */
function isNumber(v) {
    return typeof v === 'number' && Number.isFinite(v);
}

/**
 * @param {unknown} v
 * @param {number} [max=MAX_ARRAY_LEN]
 * @returns {boolean}
 */
function isArray(v, max = MAX_ARRAY_LEN) {
    return Array.isArray(v) && v.length <= max;
}

/**
 * Validate data against a schema.
 * Schema shape: { required?: string[], optional?: string[], types?: Record<string, 'id'|'string'|'number'|'boolean'|'array'|'object'> }
 * @param {Record<string, unknown>} data
 * @param {{ required?: string[], optional?: string[], types?: Record<string, string> }} schema
 * @returns {boolean}
 */
export function validate(data, schema) {
    if (!data || typeof data !== 'object') return false;

    const { required = [], optional = [], types = {} } = schema;
    const allowedKeys = new Set([...required, ...optional]);
    const dataKeys = Object.keys(data);

    for (const key of dataKeys) {
        if (!allowedKeys.has(key)) return false;
    }

    for (const key of required) {
        if (!(key in data)) return false;
    }

    for (const key of dataKeys) {
        const expectedType = types[key];
        if (!expectedType) continue;

        const val = data[key];
        switch (expectedType) {
            case 'id':
                if (!isObjectId(val)) return false;
                break;
            case 'string':
                if (!isShortString(val)) return false;
                break;
            case 'number':
                if (!isNumber(val)) return false;
                break;
            case 'boolean':
                if (typeof val !== 'boolean') return false;
                break;
            case 'array':
                if (!isArray(val)) return false;
                break;
            case 'object':
                if (!val || typeof val !== 'object' || Array.isArray(val)) return false;
                break;
        }
    }

    return true;
}

/**
 * Pick only allowed keys from data and validate nested object fields.
 * @param {Record<string, unknown>} data
 * @param {string[]} allowedKeys
 * @returns {Record<string, unknown>|null} sanitized object or null if invalid
 */
export function sanitize(data, allowedKeys) {
    if (!data || typeof data !== 'object') return null;
    /** @type {Record<string, unknown>} */
    const result = {};
    for (const key of allowedKeys) {
        if (key in data) {
            result[key] = data[key];
        }
    }
    return result;
}

/**
 * Check that all keys in data are within the allowed set.
 * @param {Record<string, unknown>} data
 * @param {string[]} allowed
 * @returns {boolean}
 */
export function allowedFields(data, allowed) {
    if (!data || typeof data !== 'object') return false;
    return Object.keys(data).every((key) => allowed.includes(key));
}

// --- Schemas for socket events ---

export const SCHEMAS = {
    // --- List ---
    LIST_CREATE: {
        required: ['_id', 'boardId', 'title', 'order'],
        types: { _id: 'id', boardId: 'id', title: 'string', order: 'string' },
    },
    LIST_DELETE: {
        required: ['id'],
        types: { id: 'id' },
    },
    LIST_MOVE: {
        required: ['id', 'fromIndex', 'toIndex'],
        types: { id: 'id', fromIndex: 'number', toIndex: 'number' },
    },
    LIST_UPDATE_ALL: {
        required: [],
        types: { __array: 'array' },
    },
    LIST_MOVE_TO_BOARD: {
        required: ['boardId', 'list', 'cards', 'index'],
        types: { boardId: 'id', list: 'object', cards: 'array', index: 'number' },
    },
    LIST_UPDATE: {
        required: ['id', 'field', 'value'],
        types: { id: 'id', field: 'string', value: 'string' },
    },

    // --- Card ---
    CARD_CREATE: {
        required: ['_id', 'boardId', 'listId', 'title', 'order'],
        types: {
            _id: 'id', boardId: 'id', listId: 'id', title: 'string', order: 'string',
            description: 'string', highlight: 'string', priorityLevel: 'string',
            verified: 'boolean', owner: 'string', dueDate: 'string',
        },
    },
    CARD_DELETE: {
        required: ['listId', 'id'],
        types: { listId: 'id', id: 'id' },
    },
    CARD_COPY: {
        required: ['card', 'index'],
        types: { card: 'object', index: 'number' },
    },
    CARD_MOVE: {
        required: ['oldListId', 'newListId', 'id', 'newCard'],
        types: { oldListId: 'id', newListId: 'id', id: 'id', newCard: 'object' },
    },
    CARD_MOVE_BY_INDEX: {
        required: ['cards', 'listId'],
        types: { cards: 'array', listId: 'id' },
    },
    CARD_MOVE_TO_LIST: {
        required: ['oldListId', 'newListId', 'insertedIndex', 'card'],
        types: { oldListId: 'id', newListId: 'id', insertedIndex: 'number', card: 'object' },
    },
    CARD_UPDATE: {
        required: ['id', 'listId', 'field', 'value'],
        types: { id: 'id', listId: 'id', field: 'string' },
    },

    // --- Chat ---
    CHAT_SEND: {
        required: ['chatMessage'],
        types: { chatMessage: 'object' },
    },
    CHAT_DELETE: {
        required: ['id'],
        types: { id: 'id' },
    },

    // --- Comment ---
    COMMENT_CREATE: {
        required: ['comment'],
        types: { comment: 'object' },
    },
    COMMENT_DELETE: {
        required: ['commentId', 'cardId'],
        types: { commentId: 'id', cardId: 'id' },
    },

    // --- Attachment ---
    ATTACHMENT_CREATE: {
        required: ['attachment'],
        types: { attachment: 'object' },
    },
    ATTACHMENT_DELETE: {
        required: ['id', 'cardId'],
        types: { id: 'id', cardId: 'id' },
    },
};

// --- Field allowlists for nested objects (strip injection vectors) ---

export const LIST_FIELDS = ['_id', 'boardId', 'title', 'order', 'createdAt', 'updatedAt'];
export const CARD_FIELDS = ['_id', 'boardId', 'listId', 'title', 'order', 'description', 'highlight', 'priorityLevel', 'verified', 'owner', 'dueDate', 'createdAt', 'updatedAt'];
export const CHAT_MESSAGE_FIELDS = ['_id', 'content', 'sentBy', 'createdAt', 'type'];
export const COMMENT_FIELDS = ['_id', 'cardId', 'content', 'createdBy', 'createdAt', 'deleted'];
export const ATTACHMENT_FIELDS = ['_id', 'doc', 'filename', 'mimetype', 'size', 'url', 'createdAt'];
