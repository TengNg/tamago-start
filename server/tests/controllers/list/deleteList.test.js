const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const app = require('../../../index');
const List = require('../../../models/List');
const Board = require('../../../models/Board');
const {
    createTestUser,
    createTestBoard,
    createTestList,
    createTestCard,
} = require('../../helpers/generateDoc');
const { objectId } = require('../../helpers/common');

describe('DELETE /lists/:id', () => {
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
        for (let i = 1; i <= 10; i++) {
            await createTestCard(testBoard._id, testList._id);
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
            .delete(`/api/lists/${unknownId}`)
            .set('Cookie', `${cookieName}=${accessToken}`)
        expect(res.statusCode).toBe(404);
    });

    it('should return 403 if user does not have access to board', async () => {
        const anotherUser = await createTestUser();
        const anotherBoard = await createTestBoard(anotherUser._id);
        const anotherList = await createTestList(anotherBoard._id);
        const res = await request(app)
            .delete(`/api/lists/${anotherList._id}`)
            .set('Cookie', `${cookieName}=${accessToken}`)
        expect(res.statusCode).toBe(403);
        expect(res.body.message).toBe("You do not have permission to delete lists");
    });

    it('should successfully delete list', async () => {
        const res = await request(app)
            .delete(`/api/lists/${testList._id}`)
            .set('Cookie', `${cookieName}=${accessToken}`)

        expect(res.statusCode).toBe(204);

        const lists = await List.find({ title: testList.title })
        expect(lists.length).toBe(0);

        const board = await Board.findOne({});
        expect(board.listCount).toBe(0);
    });
});


