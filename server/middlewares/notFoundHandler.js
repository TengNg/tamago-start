/**
 * @param {import('express').Request} _req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} _next
 */
const notFoundHandler = (_req, res, _next) => {
    return res.sendStatus(404);
}

export default notFoundHandler;
