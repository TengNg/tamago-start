const mongoose = require('mongoose');

const AttachmentSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['card', 'writedown'],
        required: true
    },
    refId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    data: {
        type: Buffer,
        required: true
    },
    mimetype: {
        type: String,
        required: true
    },
    originalname: {
        type: String,
        default: ''
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Attachment', AttachmentSchema);
