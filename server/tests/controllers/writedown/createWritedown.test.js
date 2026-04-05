const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const app = require('../../../index');
const {
    createTestUser,
} = require('../../helpers/generateDoc');

describe('POST /personal_writedowns', () => {
    let cookieName = process.env.ACCESS_TOKEN_COOKIE_NAME;
    let accessToken;
    let testUser;

    beforeAll(async () => {
        await mongoose.connect(global.__MONGO_URI__);
    });

    afterAll(async () => {
        await mongoose.disconnect();
    });

    beforeEach(async () => {
        const collections = mongoose.connection.collections;
        for (const key in collections) {
            await collections[key].deleteMany({});
        }

        testUser = await createTestUser();

        accessToken = jwt.sign(
            {
                userId: testUser._id.toString(),
                username: testUser.username,
                refreshTokenVersion: testUser.refreshTokenVersion || 0,
            },
            process.env.ACCESS_TOKEN_SECRET || 'testsecret',
            { expiresIn: '1h' }
        );
    });

    afterEach(async () => {
        const collections = mongoose.connection.collections;
        for (const key in collections) {
            await collections[key].deleteMany({});
        }
    });

    it('should create a new writedown with default values', async () => {
        const res = await request(app)
            .post('/api/personal_writedowns')
            .set('Cookie', `${cookieName}=${accessToken}`)
            .send({ rank: "1000" });

        expect(res.statusCode).toBe(200);
        expect(res.body.newWritedown).toBeDefined();
        expect(res.body.newWritedown.owner.toString()).toBe(testUser._id.toString());
        expect(res.body.newWritedown.order).toBe("1000");
        expect(res.body.newWritedown.title).toBeDefined();
        expect(res.body.newWritedown.content).toBe('');
        expect(res.body.newWritedown.pinned).toBe(false);
    });
});
