import { Schema, model } from 'mongoose';
import { MAX_BOARD_MEMBER_COUNT } from '../constants/limits.js';
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

boardMembershipSchema.pre('save', async function(next) {
    if (this.isNew) {
        const BoardMembership = model('BoardMembership');
        const membershipCount = await BoardMembership.countDocuments({ boardId: this.boardId });
        if (membershipCount >= MAX_BOARD_MEMBER_COUNT) {
            const error = new Error(`Maximum member count reached (maximum: ${MAX_BOARD_MEMBER_COUNT})`);
            return next(error);
        }
    }
});

export default model('BoardMembership', boardMembershipSchema);
