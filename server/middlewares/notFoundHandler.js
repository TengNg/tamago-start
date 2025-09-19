const notFoundHandler = (req, res, next) => {
    return res.status(404).json({ msg: "Resource not found" });
}

module.exports = notFoundHandler;
