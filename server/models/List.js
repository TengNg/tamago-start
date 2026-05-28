import { Schema, model } from 'mongoose';
import { MAX_LIST_COUNT } from '../constants/limits.js';

const listSchema = new Schema({
    title: {
        type: String,
        required: true,
    },

    order: {
        type: String,
        required: true,
    },

    boardId: {
        type: Schema.Types.ObjectId,
        ref: 'Board',
        required: true,
    },

    createdAt: {
        type: Date,
        required: true,
        default: Date.now,
    },
});

listSchema.index({ boardId: 1, order: 1 });

listSchema.pre('save', async function(next) {
    if (this.isNew) {
        const count = await model('List').countDocuments({ boardId: this.boardId });
        if (count >= MAX_LIST_COUNT) {
            const error = new Error(`Maximum list count reached for this board (maximum: ${MAX_LIST_COUNT})`);
            return next(error);
        }
    }
    next();
});

export default model('List', listSchema);
