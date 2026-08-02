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
        type: String,
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
                    const month = parseInt(value.split("-")[1], 10);
                    return month >= 1 && month <= 12;
                },
                message: 'month must be between 1 and 12'
            },
            {
                validator: function(/** @type {string | null} */value) {
                    if (!value) return true;
                    const day = parseInt(value.split("-")[2], 10);
                    return day >= 1 && day <= 31;
                },
                message: 'day must be between 1 and 31'
            }
        ],
    },

    updatedAt: {
        type: Date,
        default: Date.now,
    },

    createdAt: {
        type: Date,
        required: true,
        default: Date.now,
    },
});

cardSchema.index({ boardId: 1, order: 1 });
cardSchema.index({ listId: 1, order: 1 });

export default model('Card', cardSchema);
