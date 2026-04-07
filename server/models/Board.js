import { Schema, model } from 'mongoose';
import { MAX_BOARD_COUNT } from '../data/limits.js';

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

    listCount: {
        type: Number,
        default: 0
    },

    cardCount: {
        type: Number,
        default: 0
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
    this.$locals.wasNew = this.isNew;

    if (this.isNew) {
        const Board = model('Board');
        const boardCount = await Board.countDocuments({ createdBy: this.createdBy });
        if (boardCount >= MAX_BOARD_COUNT) {
            const error = new Error(`Maximum board count reached (maximum: ${MAX_BOARD_COUNT})`);
            return next(error);
        }
    }
});

boardSchema.post('save', async function(doc) {
    if (!doc.$locals.wasNew) {
        return;
    }

    try {
        const BoardMembership = model('BoardMembership');
        await BoardMembership.create({
            boardId: doc._id,
            userId: doc.createdBy,
            role: 'owner',
        });
    } catch (err) {
        console.log("BoardMembership is not created for owner", err.message);
    } finally {
        delete doc.$locals.wasNew;
    }
});

// // delete all related board_memberships
// boardSchema.post('findOneAndDelete', async function(doc, _next) {
//     const BoardMembership = mongoose.model('BoardMembership');
//     await BoardMembership.deleteMany({ boardId: doc._id, });
// });

export default model('Board', boardSchema);
