const mongoose = require('mongoose');
const crypto = require('crypto');
const { MAX_CARD_COUNT } = require('../data/limits');

const cardSchema = new mongoose.Schema({
    trackedId: {
        type: String,
        default: crypto.randomUUID(),
        required: true,
    },

    listId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'List',
        required: true,
    },

    boardId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Board',
        required: true,
    },

    title: {
        type: String,
        required: true,
    },

    description: {
        type: String,
        default: "",
    },

    order: {
        type: String,
        required: true,
    },

    highlight: {
        type: String,
        default: null,
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

    // labels: [{
    //     type: mongoose.Schema.Types.ObjectId,
    //     ref: 'Label',
    // }],
    //
    // comments: [{
    //     text: String,
    //     userId: {
    //         type: mongoose.Schema.Types.ObjectId,
    //         ref: 'User',
    //     },
    // }],
    //
    // attachments: [{
    //     filename: String,
    //     url: String,
    // }],
});

cardSchema.index({ boardId: 1, order: 1 });
cardSchema.index({ listId: 1, order: 1 });

cardSchema.pre('save', async function(next) {
    if (this.isNew) {
        const Board = mongoose.model('Board');
        const foundBoard = await Board.findById(this.boardId)
        if (foundBoard && foundBoard.cardCount >= MAX_CARD_COUNT) {
            const error = new Error(`Maximum card count reached for this board (maximum: ${MAX_CARD_COUNT})`);
            return next(error);
        }
    } else {
        this.updatedAt = new Date();
    }

    if (this.dueDate) {
        this.dueDate.setHours(0, 0, 0, 0);
    }

    next();
});

cardSchema.post('save', async function(doc, next) {
    const Board = mongoose.model('Board');
    await Board.updateOne({ _id: doc.boardId }, { $inc: { cardCount: 1 } });
    next();
});

cardSchema.post('findOneAndDelete', async function(doc) {
    const Board = mongoose.model('Board');
    const foundBoard = await Board.findById(doc.boardId);
    if (foundBoard) {
        await Board.updateOne({ _id: doc.boardId }, { $inc: { cardCount: -1 } });
    }
});

module.exports = mongoose.model('Card', cardSchema);
