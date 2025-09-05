const RATE_LIMIT_DURATION = 2 * 60 * 1000;
const BLOCK_PERIOD_MS = 5 * 60 * 1000;
const MAX_REQUESTS = 10;

/** @type {{[key: string]: number[]}} */
const requestLogs = {};

/** @type {{[key: string]: number}} */
const blockedUsers = {};

/**
 *
 * @param req
 * @param res
 * @param next
 */
function rateLimiter(req, res, next) {
    const userIP = req.ip;
    const currentTime = Date.now();
    const blocked = blockedUsers[userIP];

    if (blocked && currentTime < blocked) {
        const remaining = Math.ceil((blocked - currentTime) / 1000);
        if (remaining === 0) {
            delete blockedUsers[userIP];
        } else {
            const errMsg = `Too many requests. Try again in ${remaining} seconds.`;
            return res.status(429).json({ msg: errMsg });
        }
    }

    if (!requestLogs[userIP]) {
        requestLogs[userIP] = [];
    }

    if (blocked && currentTime >= blocked) {
        delete blockedUsers[userIP];
    }

    if (requestLogs[userIP].length >= MAX_REQUESTS) {
        blockedUsers[userIP] = currentTime + BLOCK_PERIOD_MS;
        const errMsg = 'Too many requests. Please try again later 5 minutes.';
        return res.status(429).json({ msg: errMsg });
    }

    requestLogs[userIP] = requestLogs[userIP].filter(timestamp => {
        return currentTime - timestamp < RATE_LIMIT_DURATION
    });

    requestLogs[userIP].push(currentTime);
    next();
}

module.exports = rateLimiter;
