/**
 * @param {Error & { status: number }} err
 * @param {import('express').Request} _req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} _next
 */
const errorHandler = (err, _req, res, _next) => {
    const message = (err && typeof err.message === 'string' && err.message.trim())
        ? err.message.trim()
        : 'Internal server error';

    const status = (err && typeof err.status === 'number')
        ? err.status
        : 500

    const isProd = process.env.MODE === 'production';

    res.status(status).json({
        message,
        ...(isProd ? {} : { stack: err?.stack })
    });
};

module.exports = errorHandler;
