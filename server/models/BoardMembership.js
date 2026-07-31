import { Schema, model } from 'mongoose';
import { DEFAULT_BOARD_PERMISSIONS } from '../constants/permissions.js';

const boardMembershipSchema = new Schema({
    boardId: {
        type: Schema.Types.ObjectId,
        ref: 'Board',
        required: true,
    },

    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User', required: true,
    },

    role: {
        type: String,
        enum: ['owner', 'member'],
        required: true,
    },

    createdAt: {
        type: Date,
        required: true,
        default: Date.now,
    },

    permissions: {
        type: {
            lists: {
                create: { type: Boolean, default: true },
                edit: { type: Boolean, default: true },
                delete: { type: Boolean, default: true },
                view: { type: Boolean, default: true }
            },
            cards: {
                create: { type: Boolean, default: true },
                edit: { type: Boolean, default: true },
                delete: { type: Boolean, default: true },
                view: { type: Boolean, default: true },
                comments: {
                    create: { type: Boolean, default: true },
                    edit: { type: Boolean, default: true },
                    delete: { type: Boolean, default: true },
                    view: { type: Boolean, default: true }
                },
                attachments: {
                    create: { type: Boolean, default: true },
                    delete: { type: Boolean, default: true },
                    view: { type: Boolean, default: true }
                }
            },
        },
        default: function() {
            return DEFAULT_BOARD_PERMISSIONS;
        }
    },
}, { collection: 'board_memberships' });

boardMembershipSchema.index({ boardId: 1, userId: 1 }, { unique: true });

export default model('BoardMembership', boardMembershipSchema);
