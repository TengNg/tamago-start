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

    createdAt: {
        type: Date,
        required: true,
        default: Date.now,
    },

    trackedId: {
        type: String,
        required: true,
    },
});

const Chat = model('Chat', chatSchema);

export default Chat;
