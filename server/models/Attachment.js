const mongoose = require('mongoose');

const AttachmentSchema = new mongoose.Schema({
    docModel: {
        type: String,
        enum: ['Card', 'Writedown'],
        required: true
    },
    doc: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        refPath: "docModel",
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
