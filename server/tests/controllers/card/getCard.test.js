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

describe('GET /cards/:id', () => {
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

    it('should return 404 if id not found', async () => {
        const unknownId = objectId();
        const res = await request(app)
            .get(`/api/cards/${unknownId}`)
            .set('Cookie', `${cookieName}=${accessToken}`)
        expect(res.statusCode).toBe(404);
    });

    it('should return 403 if user does not have access to board', async () => {
        const anotherUser = await createTestUser();
        const anotherBoard = await createTestBoard(anotherUser._id);
        const anotherList = await createTestList(anotherBoard._id);
        const anotherCard = await createTestCard(anotherBoard._id, anotherList._id);
        const res = await request(app)
            .get(`/api/cards/${anotherCard._id}`)
            .set('Cookie', `${cookieName}=${accessToken}`)
        expect(res.statusCode).toBe(403);
        expect(res.body.message).toBe("You do not have permission to view cards");
    });

    it('should return 200 if id is found', async () => {
        const res = await request(app)
            .get(`/api/cards/${testCard._id}`)
            .set('Cookie', `${cookieName}=${accessToken}`)
        expect(res.statusCode).toBe(200);
    });
});

