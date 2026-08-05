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

joinBoardRequestSchema.post('save', async function(doc) {
    if (doc.status === 'accepted') {
        try {
            const BoardMembership = model('BoardMembership');
            await BoardMembership.create({
                boardId: doc.boardId,
                userId: doc.requester,
                role: 'member'
            });
        } catch (error) {
            console.error("Error creating BoardMembership:", error);
        }
    }
});

export default model('join_board_requests', joinBoardRequestSchema);
