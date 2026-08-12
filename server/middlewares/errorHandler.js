/**
 * @param {Error & { status: number, code?: string, name?: string, path?: string }} err
 * @param {import('express').Request} _req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} _next
 */
const errorHandler = (err, _req, res, _next) => {
    if (err && err.name === 'ValidationError') {
        const errors = /** @type {{ errors?: Record<string, { message?: string }> }} */ (err).errors || {};
        const message = Object.values(errors)
            .map((e) => e && e.message)
            .filter(Boolean)
            .join('; ');
        return res.status(400).json({
            message: message || err.message || 'Validation failed',
        });
    }

    if (err && err.name === 'CastError') {
        return res.status(404).json({
            message: 'Resource not found',
        });
    }

    if (err && err.name === 'MulterError') {
        const status = err.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
        return res.status(status).json({
            message: err.code === 'LIMIT_FILE_SIZE'
                ? 'File too large (max 5MB)'
                : err.message || 'File upload failed',
        });
    }

    const message = (err && typeof err.message === 'string' && err.message.trim())
        ? err.message.trim()
        : 'Internal server error';

    const status = (err && typeof err.status === 'number')
        ? err.status
        : 500

    const isProd = process.env.NODE_ENV === 'production';

    res.status(status).json({
        message,
        ...(isProd ? {} : { stack: err?.stack })
    });
};

export default errorHandler;
