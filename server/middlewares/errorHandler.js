const errorHandler = (err, _req, res, _next) => {
    return res.status(500).json({ msg: err.message });
}

module.exports = errorHandler;
