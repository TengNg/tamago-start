const errorHandler = (err, _req, res, _next) => {
    if (process.env.MODE === 'production') {
        res.status(500).json({ message: 'Internal server error' });
    } else {
        res.status(500).json({ message: err.message, stack: err.stack });
    }
}

module.exports = errorHandler;
