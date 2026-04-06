const mongoose = require('mongoose');

const writedownSchema = new mongoose.Schema({
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },

    title: {
        type: String,
        default: ""
    },

    content: {
        type: String,
        default: ""
    },

    highlight: {
        type: String,
        default: ""
    },

    pinned: {
        type: Boolean,
        default: false
    },

    order: {
        type: String,
        default: ""
    },

    createdAt: {
        type: Date,
        required: true,
        default: Date.now,
    },

    updatedAt: {
        type: Date,
        default: Date.now,
    },
});

writedownSchema.index({ owner: 1, order: 1 });

writedownSchema.pre('save', function(next) {
    if (!this.isNew) {
        this.updatedAt = new Date();
    }

    next();
});

writedownSchema.post('findOneAndDelete', async function(doc) {
    const Attachment = mongoose.model('Attachment');
    await Attachment.deleteMany({ type: "writedown", refId: doc._id });
});

module.exports = mongoose.model('Writedown', writedownSchema);
