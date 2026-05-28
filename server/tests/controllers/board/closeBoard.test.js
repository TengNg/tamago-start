import request from 'supertest';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import app from '../../../index.js';
import Board from '../../../models/Board.js';
import List from '../../../models/List.js';
import Card from '../../../models/Card.js';
import BoardMembership from '../../../models/BoardMembership.js';
import {
    createTestUser,
    createTestBoard,
    createTestList,
    createTestCard,
    createTestBoardMembership,
} from '../../helpers/generateDoc.js';
import { objectId } from '../../helpers/common.js';

describe('DELETE /boards/:id', () => {
    let cookieName = process.env.ACCESS_TOKEN_COOKIE_NAME;
    let accessToken;
    let testUser;
    let testBoard;

    let testList1;
    let testList2;

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
        testList1 = await createTestList(testBoard._id, { title: "test list 1", order: "0" });
        testList2 = await createTestList(testBoard._id, { title: "test list 2", order: "1" });

        for (let i = 0; i < 5; i++) {
            await createTestCard(testBoard._id, testList1._id);
        }

        for (let i = 0; i < 5; i++) {
            await createTestCard(testBoard._id, testList2._id);
        }

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
            .delete(`/api/boards/${unknownId}`)
            .set('Cookie', `${cookieName}=${accessToken}`)
        expect(res.statusCode).toBe(404);
    });

    it('should return 403 if user is not a owner', async () => {
        const anotherUser = await createTestUser();
        const anotherBoard = await createTestBoard(anotherUser._id);
        await createTestBoardMembership(anotherBoard._id, testUser._id, "member");
        const res = await request(app)
            .delete(`/api/boards/${anotherBoard._id}`)
            .set('Cookie', `${cookieName}=${accessToken}`)
        expect(res.statusCode).toBe(403);
    });

    it('should successfully delete board with related data', async () => {
        const res = await request(app)
            .delete(`/api/boards/${testBoard._id}`)
            .set('Cookie', `${cookieName}=${accessToken}`)
        expect(res.statusCode).toBe(200);

        const boards = await Board.countDocuments({});
        const lists = await List.countDocuments({});
        const cards = await Card.countDocuments({});
        const memberships = await BoardMembership.countDocuments({});
        expect(boards).toBe(0);
        expect(lists).toBe(0);
        expect(cards).toBe(0);
        expect(memberships).toBe(0);
    });
});

