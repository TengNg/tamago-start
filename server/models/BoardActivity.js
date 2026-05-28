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

    docModel: {
        type: String,
        enum: ['Board', 'Card', 'List'],
        required: true,
    },

    doc: {
        type: Schema.Types.ObjectId,
        required: true,
        refPath: 'docModel',
    },

    docTitle: {
        type: String,
        default: "",
    },

    action: {
        type: String,
        enum: [
            // card
            'card.created',
            'card.moved',
            'card.title_updated',
            'card.description_updated',
            'card.highlight_updated',
            'card.priority_updated',
            'card.owner_updated',
            'card.due_date_updated',
            'card.verified',
            'card.unverified',
            'card.deleted',
            'card.copied',

            // list
            'list.created',
            'list.title_updated',
            'list.reordered',
            'list.moved',
            'list.deleted',
            'list.copied',

            // board
            'board.created',
            'board.title_updated',
            'board.description_updated',
            'board.visibility_updated',
            'board.member_left',

            // comment
            'comment.created',
        ],
        required: true,
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

boardActivitySchema.index({ board: 1, createdAt: -1 });
boardActivitySchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 86400 });

export default model('BoardActivity', boardActivitySchema);
