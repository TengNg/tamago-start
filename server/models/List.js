import { Schema, model, startSession } from 'mongoose';
import { MAX_LIST_COUNT } from '../data/limits.js';

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
        const Board = model('Board');
        const foundBoard = await Board.findById(this.boardId)
        if (foundBoard && foundBoard.listCount >= MAX_LIST_COUNT) {
            const error = new Error(`Maximum list count reached for this board (maximum: ${MAX_LIST_COUNT})`);
            return next(error);
        }
    }
    next();
});

listSchema.post('save', async function(doc, next) {
    const Board = model('Board');
    await Board.updateOne({ _id: doc.boardId }, { $inc: { listCount: 1 } });
    next();
});

listSchema.post('findOneAndDelete', async function(doc) {
    const session = await startSession();
    session.startTransaction();

    const Board = model('Board');
    const Card = model('Card');

    const documentId = doc._id;
    const foundBoard = await Board.findById(doc.boardId);

    if (!foundBoard) return;

    try {
        const q = await Card.deleteMany({ listId: documentId });

        await Board.updateOne(
            { _id: doc.boardId },
            {
                $inc: { listCount: -1 },
                $set: { cardCount: foundBoard.cardCount - q.deletedCount }
            }
        );
    } catch (err) {
        await session.abortTransaction();
        throw err;
    } finally {
        session.endSession();
    }
});

export default model('List', listSchema);
