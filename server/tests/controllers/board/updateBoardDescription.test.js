import request from 'supertest';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import app from '../../../index.js';
import {
    createTestUser,
    createTestBoard,
} from '../../helpers/generateDoc.js';
import { objectId } from '../../helpers/common.js';

describe('PATCH /boards/:id/new-description (updateDescription)', () => {
    let cookieName = process.env.ACCESS_TOKEN_COOKIE_NAME;
    let accessToken;
    let testUser;
    let anotherUser;
    let ownedBoard;

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
        anotherUser = await createTestUser();

        ownedBoard = await createTestBoard(testUser._id, {
            title: "Test Board",
            description: "Original description"
        });

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

    it('should return 404 if board does not exist', async () => {
        const unknownId = objectId();
        const res = await request(app)
            .patch(`/api/boards/${unknownId}/new-description`)
            .send({ description: 'New desc' })
            .set('Cookie', `${cookieName}=${accessToken}`);

        expect(res.statusCode).toBe(404);
    });

    it('should return 403 if user is not the owner', async () => {
        const anotherToken = jwt.sign(
            {
                userId: anotherUser._id.toString(),
                username: anotherUser.username,
                refreshTokenVersion: anotherUser.refreshTokenVersion || 0,
            },
            process.env.ACCESS_TOKEN_SECRET || 'testsecret',
            { expiresIn: '1h' }
        );

        const res = await request(app)
            .patch(`/api/boards/${ownedBoard._id}/new-description`)
            .send({ description: 'New desc' })
            .set('Cookie', `${cookieName}=${anotherToken}`);

        expect(res.statusCode).toBe(403);
    });

    it('should successfully update board description', async () => {
        const newDescription = 'This is the updated board description!';

        const res = await request(app)
            .patch(`/api/boards/${ownedBoard._id}/new-description`)
            .send({ description: newDescription })
            .set('Cookie', `${cookieName}=${accessToken}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.newBoard).toBeDefined();
        expect(res.body.newBoard._id.toString()).toBe(ownedBoard._id.toString());
        expect(res.body.newBoard.description).toBe(newDescription);
    });
});
