const mongoose = require('mongoose');
const { MAX_BOARD_COUNT } = require('../data/limits');

const boardSchema = new mongoose.Schema({
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

    listCount: {
        type: Number,
        default: 0
    },

    cardCount: {
        type: Number,
        default: 0
    },

    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
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
        const Board = mongoose.model('Board');
        const boardCount = await Board.countDocuments({ createdBy: this.createdBy });
        if (boardCount >= MAX_BOARD_COUNT) {
            const error = new Error(`Maximum board count reached (maximum: ${MAX_BOARD_COUNT})`);
            return next(error);
        }
    }
});

boardSchema.post('save', async function(doc) {
    try {
        const BoardMembership = mongoose.model('BoardMembership');
        await BoardMembership.create({
            boardId: doc._id,
            userId: doc.createdBy,
            role: 'owner',
        });
    } catch (err) {
        console.log("BoardMembership is not created for owner", err);
    }
});

// // delete all related board_memberships
// boardSchema.post('findOneAndDelete', async function(doc, _next) {
//     const BoardMembership = mongoose.model('BoardMembership');
//     await BoardMembership.deleteMany({ boardId: doc._id, });
// });

module.exports = mongoose.model('Board', boardSchema);
