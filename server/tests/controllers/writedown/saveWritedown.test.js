import request from 'supertest';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import app from '../../../index.js';
import {
    createTestUser,
    createTestWritedown,
} from '../../helpers/generateDoc.js';

describe('PATCH /personal_writedowns/:writedownId (saveWritedown)', () => {
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

        testWritedown = await createTestWritedown(testUser._id, { content: 'Old content' });
        anotherUserWritedown = await createTestWritedown(anotherUser._id);

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
            .patch(`/api/personal_writedowns/${anotherUserWritedown._id}`)
            .send({ content: 'New content' })
            .set('Cookie', `${cookieName}=${accessToken}`);

        expect(res.statusCode).toBe(404);
    });

    it('should successfully update content', async () => {
        const newContent = 'new content';

        const res = await request(app)
            .patch(`/api/personal_writedowns/${testWritedown._id}`)
            .send({ content: newContent })
            .set('Cookie', `${cookieName}=${accessToken}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.updatedWritedown.content).toBe(newContent);
        expect(res.body.updatedWritedown.title).toBe(testWritedown.title);
    });
});

