/**
 * @param {Error & { status: number }} err
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
