/**
 * @typedef {Object} RateLimiterConfig
 * @property {number} maxRequests - Max requests allowed in the window
 * @property {number} windowMs - Time window in milliseconds
 * @property {number} [blockMs] - Block duration after exceeding limit (0 = no block)
 * @property {(req: import('express').Request) => string} [keyFn] - Function to extract the rate limit key from req
 * @property {string} [message] - Custom 429 message
 */

/**
 * Creates an in-memory rate limiter middleware.
 * Cleanup is lazy — stale entries are pruned on each request, no background timer.
 * @param {RateLimiterConfig} config
 * @returns {import('express').RequestHandler}
 */
export function createRateLimiter({
    maxRequests,
    windowMs,
    blockMs = 0,
    keyFn = (req) => req.ip,
    message,
}) {
    /** @type {Map<string, number[]>} */
    const logs = new Map();

    /** @type {Map<string, number>} */
    const blocks = new Map();

    return (req, res, next) => {
        const key = keyFn(req);
        const now = Date.now();

        // Prune stale timestamps
        const timestamps = (logs.get(key) || []).filter((t) => now - t < windowMs);
        logs.set(key, timestamps);

        // Check block
        const blockedUntil = blocks.get(key);
        if (blockedUntil && now < blockedUntil) {
            const remaining = Math.ceil((blockedUntil - now) / 1000);
            return res.status(429).json({
                message: message || `Too many requests. Try again in ${remaining} seconds.`,
            });
        }

        if (blockedUntil) {
            blocks.delete(key);
        }

        // Check limit
        if (timestamps.length >= maxRequests) {
            if (blockMs > 0) {
                blocks.set(key, now + blockMs);
            }
            return res.status(429).json({
                message: message || 'Too many requests. Try again later.',
            });
        }

        timestamps.push(now);
        next();
    };
}

// 5 requests/hour per IP — register
export const registerLimiter = createRateLimiter({
    maxRequests: 5,
    windowMs: 60 * 60 * 1000,
    blockMs: 60 * 60 * 1000,
    message: 'Too many registration attempts. Try again later.',
});

// 10 requests/15min per IP — login
export const loginLimiter = createRateLimiter({
    maxRequests: 10,
    windowMs: 15 * 60 * 1000,
    blockMs: 15 * 60 * 1000,
    message: 'Too many login attempts. Try again later.',
});

// 60 requests/min per userId — authenticated routes
export const userLimiter = createRateLimiter({
    maxRequests: 60,
    windowMs: 60 * 1000,
    keyFn: (req) => req.user?.userId || req.ip,
    message: 'Too many requests. Slow down.',
});
