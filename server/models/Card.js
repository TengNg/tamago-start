import { Schema, model } from 'mongoose';

const cardSchema = new Schema({
    listId: {
        type: Schema.Types.ObjectId,
        ref: 'List',
        required: true,
    },

    boardId: {
        type: Schema.Types.ObjectId,
        ref: 'Board',
        required: true,
    },

    title: {
        type: String,
        required: true,
        maxLength: 300,
        trim: true,
    },

    description: {
        type: String,
        default: "",
        maxLength: 10000,
    },

    order: {
        type: String,
        required: true,
    },

    highlight: {
        type: String,
        default: null,
        validate: {
            validator: function(/** @type {string} */value) {
                if (!value) {
                    return true;
                }

                return /^#([A-Fa-f0-9]{3,4}|[A-Fa-f0-9]{6}|[A-Fa-f0-9]{8})$/.test(value);
            },
            message: 'must be a valid hex color (e.g., #FF5733, #F00, or #FF5733AA)'
        }
    },

    priorityLevel: {
        type: String,
        enum: ['none', 'low', 'medium', 'high', 'critical'],
        default: 'none',
    },

    verified: {
        type: Boolean,
        default: false,
    },

    owner: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        default: null,
    },

    dueDate: {
        type: String,
        default: null,
        validate: [
            {
                validator: function(/** @type {string | null} */value) {
                    if (!value) return true;
                    return /^\d{4}-\d{2}-\d{2}$/.test(value);
                },
                message: 'must be in YYYY-MM-DD format'
            },
            {
                validator: function(/** @type {string | null} */value) {
                    if (!value) return true;
                    const [year, month, day] = value.split("-").map(Number);
                    if (month < 1 || month > 12) return false;
                    if (day < 1 || day > 31) return false;
                    const date = new Date(Date.UTC(year, month - 1, day));
                    return (
                        date.getUTCFullYear() === year &&
                        date.getUTCMonth() === month - 1 &&
                        date.getUTCDate() === day
                    );
                },
                message: 'must be a valid calendar date'
            }
        ],
    },
}, { timestamps: true });

cardSchema.index({ boardId: 1, order: 1 });
cardSchema.index({ listId: 1, order: 1 });

export default model('Card', cardSchema);
