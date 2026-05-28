import { Schema, model } from 'mongoose';
import { MAX_BOARD_COUNT } from '../constants/limits.js';

const boardSchema = new Schema({
    title: {
        type: String,
        required: true,
    },

    description: {
        type: String,
        default: "",
    },

    visibility: {
        type: String,
        enum: ['private', 'public'],
        default: 'private',
        required: true,
    },

    createdBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },

    createdAt: {
        type: Date,
        required: true,
        default: Date.now,
    },
});

boardSchema.pre('save', async function(next) {
    if (this.isNew) {
        const boardCount = await model('Board').countDocuments({ createdBy: this.createdBy });
        if (boardCount >= MAX_BOARD_COUNT) {
            const error = new Error(`Maximum board count reached (maximum: ${MAX_BOARD_COUNT})`);
            return next(error);
        }
    }
});

export default model('Board', boardSchema);
