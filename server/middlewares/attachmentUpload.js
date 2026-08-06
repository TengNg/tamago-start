import multer, { memoryStorage } from 'multer';
import { extname } from 'path';

const MAX_FILESIZE_IN_MB = 5;

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
    'application/vnd.ms-htmlhelp',        // .chm
    // Web script-bearing types (stored-XSS protection)
    'text/html',
    'application/xhtml+xml',
    'image/svg+xml',
    'text/xml',
    'application/xml',
];

/**
 * MIME types that must never be served/executed, regardless of how the file
 * declares itself. Used against the `file-type` sniffed value at upload time.
 */
const dangerousMimeTypes = [
    'text/html',
    'application/xhtml+xml',
    'image/svg+xml',
    'text/xml',
    'application/xml',
    'application/xml-dtd',
    'text/javascript',
    'application/javascript',
    'application/x-javascript',
    'application/x-msdownload',
    'application/x-dosexec',
    'application/java-archive',
    'application/x-php',
];

/**
 * @param {import('express').Request} _req
 * @param {Express.Multer.File} file
 * @param {import('multer').FileFilterCallback} cb
 */
const fileFilter = (_req, file, cb) => {
    const ext = extname(file.originalname).toLowerCase();
    const mime = file.mimetype.toLowerCase();

    if (blockedExtensions.includes(ext) || blockedMimeTypes.includes(mime)) {
        const error = new Error("File blocked for security reasons - dangerous type detected");
        return cb(error);
    }

    return cb(null, true);
};

const storage = memoryStorage();

const upload = multer({
    storage,
    limits: { fileSize: MAX_FILESIZE_IN_MB * 1024 * 1024 },
    fileFilter,
});

export {
    upload as default,
    dangerousMimeTypes,
};
