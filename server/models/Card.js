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
        type: Date,
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
