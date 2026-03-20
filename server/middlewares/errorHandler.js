/**
 * @param {Error} err
 * @param {import('express').Request} _req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} _next
 */
const errorHandler = (err, _req, res, _next) => {
    const message = (err && typeof err.message === 'string' && err.message.trim())
        ? err.message.trim()
        : 'Internal server error';

    const isProd = process.env.MODE === 'production';

    res.status(500).json({
        message,
        ...(isProd ? {} : { stack: err?.stack })
    });
};

module.exports = errorHandler;
