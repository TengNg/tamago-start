const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const app = require('../../../index');
const {
    createTestUser,
    createTestBoard,
    createTestBoardMembership,
} = require('../../helpers/generateDoc');
const { objectId } = require('../../helpers/common');

describe('DELETE /boards/:id/leave (leaveBoard)', () => {
    let cookieName = process.env.ACCESS_TOKEN_COOKIE_NAME;
    let accessToken;
    let testUser;
    let anotherUser;
    let ownedBoard;
    let joinedBoard;

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

        ownedBoard = await createTestBoard(testUser._id, { title: "My Owned Board" });

        joinedBoard = await createTestBoard(anotherUser._id, { title: "Joined Board" });
        await createTestBoardMembership(joinedBoard._id, testUser._id, 'member');

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
            .delete(`/api/boards/${unknownId}/members/leave`)
            .set('Cookie', `${cookieName}=${accessToken}`);

        expect(res.statusCode).toBe(404);
    });

    it('should return 403 if user is not a member (or is owner)', async () => {
        const res = await request(app)
            .delete(`/api/boards/${ownedBoard._id}/members/leave`)
            .set('Cookie', `${cookieName}=${accessToken}`);

        expect(res.statusCode).toBe(403);
    });

    it('should successfully let a member leave the board', async () => {
        const res = await request(app)
            .delete(`/api/boards/${joinedBoard._id}/members/leave`)
            .set('Cookie', `${cookieName}=${accessToken}`);

        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({ message: 'Member removed from the board successfully' });
    });
});
