const mongoose = require('mongoose');

function objectId() {
    return new mongoose.Types.ObjectId();
}

module.exports = {
    objectId,
}
