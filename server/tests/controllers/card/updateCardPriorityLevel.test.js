const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const app = require('../../../index');
const {
    createTestUser,
    createTestBoard,
    createTestList,
    createTestCard,
    initializeTestDocs
} = require('../../helpers/generateDoc');
const { objectId } = require('../../helpers/common');

describe('PATCH /cards/:id/new-priority', () => {
    let cookieName = process.env.ACCESS_TOKEN_COOKIE_NAME;
    let accessToken;
    let testUser;
    let testBoard;
    let testList;
    let testCard;
    let mockRequestBody;
    let mockRequestBody2;

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

        mockRequestBody = {
            priorityLevel: "high",
        }

        mockRequestBody2 = {
            priorityLevel: "unknown",
        }
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
            .patch(`/api/cards/${unknownId}/new-priority`)
            .set('Cookie', `${cookieName}=${accessToken}`)
            .send(mockRequestBody)
        expect(res.statusCode).toBe(404);
    });

    it('should return 403 if user does not have access to board', async () => {
        const anotherUser = await createTestUser();
        const anotherBoard = await createTestBoard(anotherUser._id);
        const anotherList = await createTestList(anotherBoard._id);
        const anotherCard = await createTestCard(anotherBoard._id, anotherList._id);
        const res = await request(app)
            .patch(`/api/cards/${anotherCard._id}/new-priority`)
            .set('Cookie', `${cookieName}=${accessToken}`)
            .send(mockRequestBody)
        expect(res.statusCode).toBe(403);
        expect(res.body.message).toBe("You do not have permission to edit cards");
    });

    it('should return 200 if id is found', async () => {
        const res = await request(app)
            .patch(`/api/cards/${testCard._id}/new-priority`)
            .set('Cookie', `${cookieName}=${accessToken}`)
            .send(mockRequestBody)
        expect(res.statusCode).toBe(200);
        expect(res.body.newCard.priority).toBe(mockRequestBody.priorityName);
    });
});

