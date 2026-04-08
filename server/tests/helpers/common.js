import mongoose from 'mongoose';

function objectId() {
    return new mongoose.Types.ObjectId();
}

export { objectId };
