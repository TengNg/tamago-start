const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const app = require('../../../index');
const BoardMembership = require('../../../models/BoardMembership');
const {
    initializeTestDocs,
} = require('../../helpers/generateDoc');

describe('POST /cards/:id/copy', () => {
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

    it('should return 500 if rank is missing', async () => {
        const res = await request(app)
            .post(`/api/cards/${testCard._id}/copy`)
            .set('Cookie', `${cookieName}=${accessToken}`)
            .send({});
        expect(res.statusCode).toBe(500);
    });

    it('should return 403 if has no permission', async () => {
        await BoardMembership.findOneAndDelete({
            userId: testUser._id,
            boardId: testBoard._id,
        });
        const res = await request(app)
            .post(`/api/cards/${testCard._id}/copy`)
            .set('Cookie', `${cookieName}=${accessToken}`)
            .send({});
        expect(res.statusCode).toBe(403);
        expect(res.body.message).toBe("You do not have permission to create cards");
    });

    it('should return 200 if has rank', async () => {
        const res = await request(app)
            .post(`/api/cards/${testCard._id}/copy`)
            .set('Cookie', `${cookieName}=${accessToken}`)
            .send({ rank: "0" });
        expect(res.statusCode).toBe(200);
    });
});
