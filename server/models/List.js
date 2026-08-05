import { Schema, model } from 'mongoose';

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
}, { timestamps: true });

listSchema.index({ boardId: 1, order: 1 });

export default model('List', listSchema);
