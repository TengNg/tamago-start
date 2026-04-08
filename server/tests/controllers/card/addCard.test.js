import request from 'supertest';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import app from '../../../index.js';
import Card from '../../../models/Card.js';
import {
    createTestUser,
    createTestBoard,
    createTestList,
    initializeTestDocs,
} from '../../helpers/generateDoc.js';
import { objectId } from '../../helpers/common.js';

describe('POST /api/cards', () => {
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
        const { user, board, list, card } = await initializeTestDocs();
        testUser = user;
        testBoard = board;
        testList = list;
        testCard = card;
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

    it('should return 400 if required fields are missing', async () => {
        const res = await request(app)
            .post('/api/cards')
            .set('Cookie', `${cookieName}=${accessToken}`)
            .send({});
        expect(res.statusCode).toBe(403);
    });

    it('should return 403 if list does not exist', async () => {
        const res = await request(app)
            .post('/api/cards')
            .set('Cookie', `${cookieName}=${accessToken}`)
            .send({
                listId: objectId(),
                boardId: testBoard._id,
                title: 'Card on missing list',
                order: 'abc123'
            });
        expect(res.statusCode).toBe(403);
        expect(res.body.message).toBe("list not found");
    });

    it('should return 403 if user does not have access to board', async () => {
        const anotherUser = await createTestUser();
        const anotherBoard = await createTestBoard(anotherUser._id);
        const anotherList = await createTestList(anotherBoard._id);
        const res = await request(app)
            .post('/api/cards')
            .set('Cookie', `${cookieName}=${accessToken}`)
            .send({
                listId: anotherList._id,
                boardId: objectId(),
                title: 'Card for missing board',
                order: 'abc124'
            });
        expect(res.statusCode).toBe(403);
        expect(res.body.message).toBe("You do not have permission to create cards");
    });

    it('should successfully create a new card', async () => {
        const body = {
            listId: testList._id,
            boardId: testBoard._id,
            title: 'Test Card',
            order: 'card1order'
        };
        const res = await request(app)
            .post('/api/cards')
            .set('Cookie', `${cookieName}=${accessToken}`)
            .send(body);
        expect(res.statusCode).toBe(201);
        expect(res.body).toHaveProperty('newCard');
        expect(res.body.newCard).toMatchObject({
            title: body.title,
            listId: body.listId.toString(),
            boardId: body.boardId.toString(),
            order: body.order
        });
        const cardInDb = await Card.findOne({ title: 'Test Card' });
        expect(cardInDb).toBeTruthy();
        expect(cardInDb.listId.toString()).toEqual(body.listId.toString());
        expect(cardInDb.boardId.toString()).toEqual(body.boardId.toString());
    });

    it('should return 500 when title is missing, failed to create card', async () => {
        const res = await request(app)
            .post('/api/cards')
            .set('Cookie', `${cookieName}=${accessToken}`)
            .send({
                listId: testList._id,
                boardId: testBoard._id,
                order: 'blanktitle'
            });
        expect(res.statusCode).toBe(500);
    });
});
