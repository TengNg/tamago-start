const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const app = require('../../../index');
const List = require('../../../models/List');
const {
    createTestUser,
    createTestBoard,
    createTestList,
} = require('../../helpers/generateDoc');
const { objectId } = require('../../helpers/common');

describe('DELETE /lists/:id/reorder', () => {
    let cookieName = process.env.ACCESS_TOKEN_COOKIE_NAME;
    let accessToken;
    let testUser;
    let testBoard;
    let testLists;

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
        for (let i = 1; i <= 5; i++) {
            await createTestList(
                testBoard._id,
                { title: `test list ${i}`, order: i.toString() }
            );
        }
        testLists = await List.find({ boardId: testBoard._id }).sort({ order: 1 });
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
            .patch(`/api/lists/${unknownId}/reorder`)
            .set('Cookie', `${cookieName}=${accessToken}`)
            .send({ rank: "0", sourceIndex: "1", destinationIndex: "2" });
        expect(res.statusCode).toBe(404);
    });

    it('should return 403 if user does not have access to board', async () => {
        const anotherUser = await createTestUser();
        const anotherBoard = await createTestBoard(anotherUser._id);
        const anotherList = await createTestList(anotherBoard._id);
        const res = await request(app)
            .patch(`/api/lists/${anotherList._id}/reorder`)
            .set('Cookie', `${cookieName}=${accessToken}`)
            .send({ rank: "10", sourceIndex: "3", destinationIndex: "2" });
        expect(res.statusCode).toBe(403);
        expect(res.body.message).toBe("You do not have permission to edit lists");
    });

    it('should successfully order list', async () => {
        const res = await request(app)
            .patch(`/api/lists/${testLists[2]._id}/reorder`)
            .set('Cookie', `${cookieName}=${accessToken}`)
            .send({ rank: "10", sourceIndex: "3", destinationIndex: "2" });
        expect(res.statusCode).toBe(200);

        const lists = await List.find({ boardId: testBoard._id }).sort({ order: 1 });
        expect(lists[1]._id.toString()).toBe(testLists[2]._id.toString());
    });
});

