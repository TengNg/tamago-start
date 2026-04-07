import { Schema, model } from 'mongoose';

const boardActivitySchema = new Schema({
    board: {
        type: Schema.Types.ObjectId,
        ref: 'Board',
        required: true,
    },

    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
    },

    card: {
        type: Schema.Types.ObjectId,
        ref: 'Card',
    },

    list: {
        type: Schema.Types.ObjectId,
        ref: 'List',
    },

    type: {
        type: String,
        enum: ['board', 'list', 'card'],
        required: true,
    },

    action: {
        type: String,
    },

    description: {
        type: String,
        default: ""
    },

    createdAt: {
        type: Date,
        default: Date.now,
        required: true,
    },
}, { collection: 'board_activities' });

export default model('BoardActivity', boardActivitySchema);
