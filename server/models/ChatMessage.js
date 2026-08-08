import { Schema, model } from 'mongoose';

const chatSchema = new Schema({
    type: {
        type: String,
        enum: ['MESSAGE', 'CARD_CODE', 'BOARD_CODE'],
        default: 'MESSAGE',
        required: true,
    },

    content: {
        type: String,
        required: true,
    },

    boardId: {
        type: Schema.Types.ObjectId,
        ref: 'Board',
        required: true,
    },

    sentBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
}, { collection: 'chat_messages', timestamps: true });

chatSchema.index({ boardId: 1, createdAt: -1 });

export default model('ChatMessage', chatSchema);
