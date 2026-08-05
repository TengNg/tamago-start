import { Schema, model } from 'mongoose';

const writedownSchema = new Schema({
    owner: {
        type: Schema.Types.ObjectId,
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
}, { timestamps: true });

writedownSchema.index({ owner: 1, order: 1 });

writedownSchema.post('findOneAndDelete', async function(doc) {
    const Attachment = model('Attachment');
    await Attachment.deleteMany({ type: "writedown", refId: doc._id });
});

export default model('Writedown', writedownSchema);
