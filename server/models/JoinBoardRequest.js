import { Schema, model } from 'mongoose';

const joinBoardRequestSchema = new Schema({
    boardId: {
        type: Schema.Types.ObjectId,
        ref: 'Board',
        required: true,
    },

    requester: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },

    status: {
        type: String,
        enum: ['pending', 'accepted', 'rejected'],
        default: 'pending',
    },
}, { timestamps: true });

joinBoardRequestSchema.index({ boardId: 1, createdAt: -1 });

export default model('join_board_requests', joinBoardRequestSchema);
