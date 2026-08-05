import { Schema, model } from 'mongoose';

const cardCommentSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },

    cardId: {
        type: Schema.Types.ObjectId,
        ref: 'Card',
        required: true,
    },

    content: {
        type: String,
        required: true,
        trim: true,
        minLength: 1,
        maxLength: 1000,
    },
}, { collection: 'card_comments', timestamps: true });

cardCommentSchema.index({ cardId: 1 });

export default model('CardComment', cardCommentSchema);
