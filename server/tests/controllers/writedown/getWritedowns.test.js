import request from 'supertest';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import app from '../../../index.js';
import {
    createTestUser,
    createTestWritedown,
} from '../../helpers/generateDoc.js';

describe('GET /personal_writedowns', () => {
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

        // Create 3 writedowns for the user
        await createTestWritedown(testUser._id, { title: 'Note A', order: 10 });
        await createTestWritedown(testUser._id, { title: 'Note B', order: 20 });
        await createTestWritedown(testUser._id, { title: 'Note C', order: 30 });

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

    it('should return all writedowns belonging to the user', async () => {
        const res = await request(app)
            .get('/api/personal_writedowns')
            .set('Cookie', `${cookieName}=${accessToken}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.writedowns).toHaveLength(3);

        const titles = res.body.writedowns.map(w => w.title);
        expect(titles).toContain('Note A');
        expect(titles).toContain('Note B');
        expect(titles).toContain('Note C');
    });

    it('should return empty array when user has no writedowns', async () => {
        const emptyUser = await createTestUser();
        const emptyToken = jwt.sign(
            {
                userId: emptyUser._id.toString(),
                username: emptyUser.username,
                refreshTokenVersion: emptyUser.refreshTokenVersion || 0,
            },
            process.env.ACCESS_TOKEN_SECRET || 'testsecret',
            { expiresIn: '1h' }
        );

        const res = await request(app)
            .get('/api/personal_writedowns')
            .set('Cookie', `${cookieName}=${emptyToken}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.writedowns).toEqual([]);
    });
});

