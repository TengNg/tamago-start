import { Schema, model } from 'mongoose';
import { MAX_CARD_COUNT } from '../constants/limits.js';

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

cardSchema.pre('save', async function(next) {
    if (this.isNew) {
        const count = await model('Card').countDocuments({ boardId: this.boardId });
        if (count >= MAX_CARD_COUNT) {
            const error = new Error(`Maximum card count reached for this board (maximum: ${MAX_CARD_COUNT})`);
            return next(error);
        }
    } else {
        this.updatedAt = new Date();
    }

    try {
        if (this.dueDate) {
            this.dueDate.setHours(0, 0, 0, 0);
        }
    } catch (err) {
        console.log(err);
    }

    next();
});

cardSchema.post('findOneAndDelete', async function(doc) {
    await model('Attachment').deleteMany({ docModel: "Card", doc: doc._id });
    await model('CardComment').deleteMany({ cardId: doc._id });
});

export default model('Card', cardSchema);
