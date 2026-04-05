const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const app = require('../../../index');
const {
    createTestUser,
    createTestWritedown,
} = require('../../helpers/generateDoc');
const { objectId } = require('../../helpers/common');

describe('DELETE /personal_writedowns/:writedownId', () => {
    let cookieName = process.env.ACCESS_TOKEN_COOKIE_NAME;
    let accessToken;
    let testUser;
    let testWritedown;
    let anotherUserWritedown;

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
        const anotherUser = await createTestUser();

        testWritedown = await createTestWritedown(testUser._id, { title: 'My Writedown' });
        anotherUserWritedown = await createTestWritedown(anotherUser._id, { title: 'Other User Writedown' });

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

    it('should return 404 if writedown does not belong to the user', async () => {
        const res = await request(app)
            .delete(`/api/personal_writedowns/${anotherUserWritedown._id}`)
            .set('Cookie', `${cookieName}=${accessToken}`);

        expect(res.statusCode).toBe(404);
    });

    it('should return 404 if writedown does not exist', async () => {
        const res = await request(app)
            .delete(`/api/personal_writedowns/${objectId()}`)
            .set('Cookie', `${cookieName}=${accessToken}`);

        expect(res.statusCode).toBe(404);
    });

    it('should successfully delete the writedown', async () => {
        const res = await request(app)
            .delete(`/api/personal_writedowns/${testWritedown._id}`)
            .set('Cookie', `${cookieName}=${accessToken}`);

        expect(res.statusCode).toBe(204);
    });
});
