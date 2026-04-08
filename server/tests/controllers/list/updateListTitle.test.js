import request from 'supertest';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import app from '../../../index.js';
import List from '../../../models/List.js';
import {
    createTestUser,
    createTestBoard,
    createTestList,
} from '../../helpers/generateDoc.js';
import { objectId } from '../../helpers/common.js';

describe('PATCH /lists/:id/new-title', () => {
    let cookieName = process.env.ACCESS_TOKEN_COOKIE_NAME;
    let accessToken;
    let testUser;
    let testBoard;
    let testList;

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
        testList = await createTestList(testBoard._id);
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
            .patch(`/api/lists/${unknownId}/new-title`)
            .set('Cookie', `${cookieName}=${accessToken}`)
            .send({ title: "new title" });
        expect(res.statusCode).toBe(404);
    });

    it('should return 403 if user does not have access to board', async () => {
        const anotherUser = await createTestUser();
        const anotherBoard = await createTestBoard(anotherUser._id);
        const anotherList = await createTestList(anotherBoard._id);
        const res = await request(app)
            .patch(`/api/lists/${anotherList._id}/new-title`)
            .set('Cookie', `${cookieName}=${accessToken}`)
            .send({ title: "new title" });
        expect(res.statusCode).toBe(403);
        expect(res.body.message).toBe("You do not have permission to edit lists");
    });

    it('should successfully update title', async () => {
        const res = await request(app)
            .patch(`/api/lists/${testList._id}/new-title`)
            .set('Cookie', `${cookieName}=${accessToken}`)
            .send({ title: "new title" });
        expect(res.statusCode).toBe(200);
        expect(res.body.newList.title).toBe("new title");
    });
});

