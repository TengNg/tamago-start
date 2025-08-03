const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        dropDups: true,
        unique: true
    },

    password: {
        type: String,
        required: [
            function() {
                return !this.dissordId;
            },
            "Password is required"
        ]
    },

    profileImage: {
        type: String,
        default: null
    },

    createdAt: {
        type: Date,
        required: true,
        default: Date.now,
    },

    recentlyViewedBoardId: {
        type: mongoose.Schema.Types.ObjectId,
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

        // validate: {
        //     validator: function(pinnedBoardIdCollection) {
        //         for (let key of pinnedBoardIdCollection.keys()) {
        //             if (key.length > 4) {
        //                 return false;
        //             }
        //         }
        //         return true;
        //     },
        //     message: 'max 4 pinned boards'
        // }
    },

    discordId: {
        type: String,
    },

    refreshTokenVersion: {
        type: Number,
        default: 0,
        required: true,
    }
});

module.exports = mongoose.model('User', UserSchema);

