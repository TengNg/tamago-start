import { Schema, model } from 'mongoose';
import { isValidUsername } from '../services/usernameValidationService.js';

const UserSchema = new Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        validate: {
            validator: isValidUsername,
            message: 'username is not allowed'
        }
    },

    password: {
        type: String,
        required: [
            function() {
                return !this.discordId;
            },
            "Password is required"
        ]
    },

    profileImage: {
        type: String,
        default: null
    },

    recentlyViewedBoardId: {
        type: Schema.Types.ObjectId,
        ref: 'Board',
    },

    pinnedBoardIdCollection: {
        type: Map,
        of: {
            title: {
                type: String,
                required: true
            },
        },
    },

    discordId: {
        type: String,
    },

    refreshTokenVersion: {
        type: Number,
        default: 0,
        required: true,
    }
}, { timestamps: true });

UserSchema.index({ discordId: 1 });

export default model('User', UserSchema);

