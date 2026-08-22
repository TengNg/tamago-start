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
            message: 'Username is not allowed'
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

    recentBoards: [
        {
            board: {
                type: Schema.Types.ObjectId,
                ref: "Board"
            },
            viewedAt: {
                type: Date,
                default: Date.now,
            }
        }
    ],

    pinnedBoards: [
        {
            board: {
                type: Schema.Types.ObjectId,
                ref: "Board",
                required: true,
            },
            pinnedAt: {
                type: Date,
                default: Date.now,
            },
            order: {
                type: String,
                required: true,
            },
        }
    ],

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

