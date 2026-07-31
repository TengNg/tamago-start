import { Schema, model } from 'mongoose';

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

    stats: {
        listCount: {
            type: Number,
            default: 0,
            min: 0,
        },

        cardCount: {
            type: Number,
            default: 0,
            min: 0,
        },
    },

    limits: {
        maxLists: {
            type: Number,
            default: 20,
            min: 1,
        },

        maxCards: {
            type: Number,
            default: 5000,
            min: 1,
        },

        maxMembers: {
            type: Number,
            default: 10,
            min: 1,
        },
    },
});

export default model('Board', boardSchema);
