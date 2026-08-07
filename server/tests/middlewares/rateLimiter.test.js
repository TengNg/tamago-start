import request from 'supertest';
import express from 'express';
import { createRateLimiter } from '../../middlewares/rateLimiter.js';

function createApp(limiter) {
    const app = express();
    app.use(limiter);
    app.get('/test', (_req, res) => res.json({ ok: true }));
    return app;
}

describe('createRateLimiter', () => {
    it('allows requests under the limit', async () => {
        const limiter = createRateLimiter({ maxRequests: 3, windowMs: 10000 });
        const app = createApp(limiter);

        const res1 = await request(app).get('/test');
        const res2 = await request(app).get('/test');
        const res3 = await request(app).get('/test');

        expect(res1.statusCode).toBe(200);
        expect(res2.statusCode).toBe(200);
        expect(res3.statusCode).toBe(200);
    });

    it('returns 429 when limit is exceeded', async () => {
        const limiter = createRateLimiter({ maxRequests: 2, windowMs: 10000 });
        const app = createApp(limiter);

        await request(app).get('/test');
        await request(app).get('/test');
        const res = await request(app).get('/test');

        expect(res.statusCode).toBe(429);
        expect(res.body.message).toBe('Too many requests. Try again later.');
    });

    it('blocks for blockMs after exceeding limit', async () => {
        const limiter = createRateLimiter({
            maxRequests: 1,
            windowMs: 10000,
            blockMs: 500,
        });
        const app = createApp(limiter);

        await request(app).get('/test');
        const blocked = await request(app).get('/test');
        expect(blocked.statusCode).toBe(429);

        // Still blocked immediately after
        const stillBlocked = await request(app).get('/test');
        expect(stillBlocked.statusCode).toBe(429);
    });

    it('allows requests again after block expires', async () => {
        const limiter = createRateLimiter({
            maxRequests: 1,
            windowMs: 50,
            blockMs: 50,
        });
        const app = createApp(limiter);

        await request(app).get('/test');
        await request(app).get('/test'); // blocked

        // Wait for block AND timestamps to expire
        await new Promise((r) => setTimeout(r, 120));

        const res = await request(app).get('/test');
        expect(res.statusCode).toBe(200);
    });

    it('prunes stale timestamps so users are not permanently blocked', async () => {
        const limiter = createRateLimiter({
            maxRequests: 2,
            windowMs: 50,
            blockMs: 50,
        });
        const app = createApp(limiter);

        // Hit the limit
        await request(app).get('/test');
        await request(app).get('/test');
        const blocked = await request(app).get('/test');
        expect(blocked.statusCode).toBe(429);

        // Wait for both block AND timestamps to expire
        await new Promise((r) => setTimeout(r, 120));

        // Should work again - stale timestamps pruned, block cleared
        const res = await request(app).get('/test');
        expect(res.statusCode).toBe(200);
    });

    it('uses custom keyFn to isolate keys', async () => {
        let callCount = 0;
        const limiter = createRateLimiter({
            maxRequests: 1,
            windowMs: 10000,
            keyFn: () => {
                callCount++;
                return callCount <= 2 ? 'user-a' : 'user-b';
            },
        });
        const app = createApp(limiter);

        const res1 = await request(app).get('/test'); // user-a, count=1
        const res2 = await request(app).get('/test'); // user-a, count=2 (blocked)
        const res3 = await request(app).get('/test'); // user-b, count=3 (allowed)

        expect(res1.statusCode).toBe(200);
        expect(res2.statusCode).toBe(429);
        expect(res3.statusCode).toBe(200);
    });

    it('uses custom message', async () => {
        const limiter = createRateLimiter({
            maxRequests: 1,
            windowMs: 10000,
            message: 'Rate limited!',
        });
        const app = createApp(limiter);

        await request(app).get('/test');
        const res = await request(app).get('/test');

        expect(res.statusCode).toBe(429);
        expect(res.body.message).toBe('Rate limited!');
    });

    it('does not block when blockMs is 0', async () => {
        const limiter = createRateLimiter({
            maxRequests: 1,
            windowMs: 50,
            blockMs: 0,
        });
        const app = createApp(limiter);

        await request(app).get('/test');
        const blocked = await request(app).get('/test');
        expect(blocked.statusCode).toBe(429);

        // Wait for timestamps to expire, then allowed again since no block
        await new Promise((r) => setTimeout(r, 80));

        const res = await request(app).get('/test');
        expect(res.statusCode).toBe(200);
    });

    it('different keys have independent limits', async () => {
        let callCount = 0;
        const limiter = createRateLimiter({
            maxRequests: 1,
            windowMs: 10000,
            keyFn: () => {
                callCount++;
                return callCount <= 1 ? 'ip-a' : 'ip-b';
            },
        });
        const app = createApp(limiter);

        await request(app).get('/test'); // ip-a (allowed)
        const res = await request(app).get('/test'); // ip-b (allowed)

        expect(res.statusCode).toBe(200);
    });

    it('shows retry-after seconds when blocked (not first trigger)', async () => {
        const limiter = createRateLimiter({
            maxRequests: 1,
            windowMs: 10000,
            blockMs: 10000,
        });
        const app = createApp(limiter);

        await request(app).get('/test'); // allowed, triggers limit check
        await request(app).get('/test'); // blocked by limit check
        const res = await request(app).get('/test'); // blocked by block check

        expect(res.statusCode).toBe(429);
        expect(res.body.message).toMatch(/Try again in \d+ seconds/);
    });
});
