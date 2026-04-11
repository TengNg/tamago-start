import request from 'supertest';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import app from '../../../index.js';
import {
    createTestUser,
    createTestBoard,
} from '../../helpers/generateDoc.js';
import { objectId } from '../../helpers/common.js';

describe('POST /api/chat/messages/b/:boardId', () => {
    let cookieName = process.env.ACCESS_TOKEN_COOKIE_NAME;
    let accessToken;
    let testUser;
    let testBoard;

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
        testBoard = await createTestBoard(testUser._id);

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

    it('should return 404 if id is not found', async () => {
        const unknownId = objectId();
        const res = await request(app)
            .post(`/api/chat/messages/b/${unknownId}`)
            .send({ content: "test chat message" })
            .set('Cookie', `${cookieName}=${accessToken}`)

        expect(res.statusCode).toBe(404);
    });

    it('should successfully send message', async () => {
        const res = await request(app)
            .post(`/api/chat/messages/b/${testBoard._id}`)
            .send({ content: "test chat message" })
            .set('Cookie', `${cookieName}=${accessToken}`)

        expect(res.statusCode).toBe(201);
        expect(res.body.chatMessage.content).toBe("test chat message");
    });
});
