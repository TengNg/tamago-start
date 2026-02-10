const multer = require('multer');
const { MAX_FILESIZE_IN_MB } = require("../data/limits");

// Use memory storage for uploaded attachments
const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: { fileSize: MAX_FILESIZE_IN_MB * 1024 * 1024 }
});

module.exports = upload;
