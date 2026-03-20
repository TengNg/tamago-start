const multer = require('multer');
const path = require('path');
const { MAX_FILESIZE_IN_MB } = require("../data/limits");

// Dangerous extensions to BLOCK — subset inspired by Mimecast's policy (high-risk only)
const blockedExtensions = [
    // Executables & binaries
    '.exe', '.dll', '.msi', '.msp', '.com', '.sys', '.drv', '.ocx', '.vxd',
    // Scripts & code
    '.js', '.jse', '.vbs', '.vbe', '.vb', '.wsf', '.wsh', '.hta', '.ps1',
    '.bat', '.cmd', '.sh', '.py', '.pyc', '.pyo', '.jar', '.jsp', '.php',
    // Shortcuts & auto-run
    '.lnk', '.pif', '.scr', '.sct', '.chm', '.hlp',
    // Installers & packages
    '.apk', '.dmg', '.ipa', '.pkg', '.mpkg', '.air',
    // Other high-risk (helpers, macros, etc.)
    '.inf', '.reg', '.cpl', '.msc', '.gadget', '.crt', '.url',
    // Macro-enabled — often vectors
    '.docm', '.xlsm', '.pptm',
];

// Dangerous MIME types for early rejection
const blockedMimeTypes = [
    'application/x-msdownload',           // .exe etc.
    'application/x-dosexec',
    'application/javascript',
    'text/javascript',
    'application/x-php',
    'application/java-archive',           // .jar
    'application/x-msi',                  // .msi
    'application/hta',                    // .hta
    'application/vnd.ms-htmlhelp'         // .chm
];

/**
 * @param {import('express').Request} _req
 * @param {Express.Multer.File} file
 * @param {import('multer').FileFilterCallback} cb
 */
const fileFilter = (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const mime = file.mimetype.toLowerCase();

    if (blockedExtensions.includes(ext) || blockedMimeTypes.includes(mime)) {
        const error = new Error("File blocked for security reasons - dangerous type detected");
        return cb(error);
    }

    return cb(null, true);
};

const storage = multer.memoryStorage();

const upload = multer({
    storage,
    limits: { fileSize: MAX_FILESIZE_IN_MB * 1024 * 1024 },
    fileFilter,
});

module.exports = upload;
