import { Schema, model } from 'mongoose';

const AttachmentSchema = new Schema({
    docModel: {
        type: String,
        enum: ['Card', 'Writedown'],
        required: true
    },
    doc: {
        type: Schema.Types.ObjectId,
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

export default model('Attachment', AttachmentSchema);
