const mongoose = require('mongoose');

const joinBoardRequestSchema = new mongoose.Schema({
    boardId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Board',
        required: true,
    },

    requester: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },

    status: {
        type: String,
        enum: ['pending', 'accepted', 'rejected'],
        default: 'pending',
    },

    createdAt: {
        type: Date,
        required: true,
        default: Date.now,
    },

    updatedAt: {
        type: Date,
        required: true,
        default: Date.now,
    },
});

// update 'updatedAt' field when 'status' is modified
joinBoardRequestSchema.pre('save', function(next) {
    if (!this.isNew) {
        this.updatedAt = new Date();
    }

    next();
});

joinBoardRequestSchema.post('save', async function(doc) {
    if (doc.status === 'accepted') {
        try {
            const BoardMembership = mongoose.model('BoardMembership');
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

module.exports = mongoose.model('join_board_requests', joinBoardRequestSchema);
