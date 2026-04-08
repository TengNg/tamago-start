import request from 'supertest';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import app from '../../../index.js';
import {
    createTestUser,
    createTestBoard,
    createTestList,
    createTestCard,
} from '../../helpers/generateDoc.js';
import { objectId } from '../../helpers/common.js';

describe('PATCH /cards/:id/toggle-verified', () => {
    let cookieName = process.env.ACCESS_TOKEN_COOKIE_NAME;
    let accessToken;
    let testUser;
    let testBoard;
    let testList;
    let testCard;

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
        testUser = await createTestUser({ verified: false });
        testBoard = await createTestBoard(testUser._id);
        testList = await createTestList(testBoard._id);
        testCard = await createTestCard(testBoard._id, testList._id);
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

    it('should return 404 if id not found', async () => {
        const unknownId = objectId();
        const res = await request(app)
            .patch(`/api/cards/${unknownId}/toggle-verified`)
            .set('Cookie', `${cookieName}=${accessToken}`)
        expect(res.statusCode).toBe(404);
    });

    it('should return 403 if user does not have access to board', async () => {
        const anotherUser = await createTestUser();
        const anotherBoard = await createTestBoard(anotherUser._id);
        const anotherList = await createTestList(anotherBoard._id);
        const anotherCard = await createTestCard(anotherBoard._id, anotherList._id);
        const res = await request(app)
            .patch(`/api/cards/${anotherCard._id}/toggle-verified`)
            .set('Cookie', `${cookieName}=${accessToken}`)
        expect(res.statusCode).toBe(403);
        expect(res.body.message).toBe("You do not have permission to edit cards");
    });

    it('should return 200 if id is found', async () => {
        const res = await request(app)
            .patch(`/api/cards/${testCard._id}/toggle-verified`)
            .set('Cookie', `${cookieName}=${accessToken}`)
        expect(res.statusCode).toBe(200);
        expect(res.body.verified).toBe(true);

        const res2 = await request(app)
            .patch(`/api/cards/${testCard._id}/toggle-verified`)
            .set('Cookie', `${cookieName}=${accessToken}`)
        expect(res2.statusCode).toBe(200);
        expect(res2.body.verified).toBe(false);
    });
});

