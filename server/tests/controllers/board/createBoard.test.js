import request from 'supertest';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import app from '../../../index.js';
import {
    createTestUser,
} from '../../helpers/generateDoc.js';

describe('POST /boards', () => {
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

    it('should return 500 if missing required fields', async () => {
        const res = await request(app)
            .post(`/api/boards`)
            .set('Cookie', `${cookieName}=${accessToken}`)
            .send({})
        expect(res.statusCode).toBe(500);
    });

    it('should successfully create board', async () => {
        const res = await request(app)
            .post(`/api/boards`)
            .set('Cookie', `${cookieName}=${accessToken}`)
            .send({
                title: "test board title",
                description: "test board description",
            })
        expect(res.statusCode).toBe(201);
        expect(res.body.newBoard.title).toBe("test board title");
        expect(res.body.newBoard.description).toBe("test board description");
    });
});

