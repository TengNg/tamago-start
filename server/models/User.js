import { Schema, model } from 'mongoose';

const INVALID_USERNAMES = Object.freeze([
  // Unknown
  "unknown", "unassigned", "none", "invalid",

  // System
  "admin", "administrator", "root", "system", "support",
  "moderator", "mod", "staff", "owner", "superuser",
  "guest", "default", "public", "api", "server", "bot",
  "null", "undefined", "true", "false",

  // Routes
  "login", "logout", "register", "signup", "signin",
  "me", "profile", "settings", "dashboard", "account",
  "users", "user", "boards", "board",
  "search", "explore", "home", "about",
  "contact", "terms", "privacy", "error",

  // Placeholder
  "test", "testing", "demo", "sample", "example",
  "temp", "temporary", "deleted",
  "anonymous", "anon",

  // Sensitive
  "verified", "official", "team", "security", "help", "info"
]);

const UserSchema = new Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        validate: {
            /** @param {any} value */
            validator: function (value) {
                const v = String(value).trim().toLowerCase();

                if (INVALID_USERNAMES.includes(v)) {
                    return false;
                }

                if (v.length < 2) {
                    return false;
                }

                // only numbers
                if (/^\d+$/.test(v)) {
                    return false;
                }

                // only allow safe chars
                if (!/^[a-z0-9_]+$/.test(v)) {
                    return false;
                }

                return true;
            },
            message: 'not allowed'
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

export default model('User', UserSchema);

