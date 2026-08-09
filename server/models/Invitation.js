import { Schema, model } from 'mongoose';

const invitationSchema = new Schema({
    boardId: {
        type: Schema.Types.ObjectId,
        ref: 'Board',
        required: true,
    },

    invitedUserId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },

    invitedByUserId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },

    status: {
        type: String,
        enum: ['pending', 'accepted', 'rejected'],
        default: 'pending',
    },
}, { timestamps: true });

invitationSchema.index({ invitedUserId: 1, createdAt: -1 });
invitationSchema.index({ boardId: 1 });

export default model('Invitation', invitationSchema);
