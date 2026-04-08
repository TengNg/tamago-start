import request from 'supertest';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import app from '../../../index.js';
import List from '../../../models/List.js';
import Board from '../../../models/Board.js';
import {
    createTestUser,
    createTestBoard,
} from '../../helpers/generateDoc.js';

describe('POST /lists', () => {
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

    it('should return 500 if required fields are missing', async () => {
        const res = await request(app)
            .post(`/api/lists`)
            .set('Cookie', `${cookieName}=${accessToken}`)
            .send({ boardId: testBoard._id })
        expect(res.statusCode).toBe(500);
    });

    it('should return 403 if user does not have access to board', async () => {
        const anotherUser = await createTestUser();
        const anotherBoard = await createTestBoard(anotherUser._id);
        const res = await request(app)
            .post(`/api/lists`)
            .set('Cookie', `${cookieName}=${accessToken}`)
            .send({ boardId: anotherBoard._id })
        expect(res.statusCode).toBe(403);
        expect(res.body.message).toBe("You do not have permission to create lists");
    });

    it('should successfully create new list', async () => {
        const res = await request(app)
            .post(`/api/lists`)
            .set('Cookie', `${cookieName}=${accessToken}`)
            .send({ boardId: testBoard._id, title: "Test List", order: "0" })
        expect(res.statusCode).toBe(201);

        const listInDb = await List.findOne({ title: 'Test List' });
        expect(listInDb).toBeTruthy();
        expect(listInDb.boardId.toString()).toEqual(testBoard._id.toString());
        expect(listInDb.order).toEqual("0");

        const board = await Board.findOne({});
        expect(board.listCount).toBe(1);
    });
});

