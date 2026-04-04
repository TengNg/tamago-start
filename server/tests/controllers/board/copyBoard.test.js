const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const app = require('../../../index');
const Board = require('../../../models/Board');
const List = require('../../../models/List');
const Card = require('../../../models/Card');
const BoardMembership = require('../../../models/BoardMembership');
const {
    createTestUser,
    createTestBoard,
    createTestList,
    createTestCard,
} = require('../../helpers/generateDoc');
const { objectId } = require('../../helpers/common');

describe('POST /boards/copy/:id', () => {
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
            .post(`/api/boards/copy/${unknownId}`)
            .set('Cookie', `${cookieName}=${accessToken}`)
            .send({});
        expect(res.statusCode).toBe(404);
    });

    it('should return 403 if user is not a member', async () => {
        const anotherUser = await createTestUser();
        const anotherBoard = await createTestBoard(anotherUser._id);
        const res = await request(app)
            .post(`/api/boards/copy/${anotherBoard._id}`)
            .set('Cookie', `${cookieName}=${accessToken}`)
            .send({});
        expect(res.statusCode).toBe(403);
    });

    it('should successfully return board with lists & cards', async () => {
        const res = await request(app)
            .post(`/api/boards/copy/${testBoard._id}`)
            .set('Cookie', `${cookieName}=${accessToken}`)
            .send({ title: "test board 2" });
        expect(res.statusCode).toBe(200);

        const copiedBoard = await Board.findOne({ title: "test board 2" });
        expect(copiedBoard).toBeTruthy();

        const lists = await List.find({ boardId: testBoard._id }).sort({ order: 1 });
        const cards = await Card.find({ boardId: testBoard._id }).sort({ order: 1 });
        const copiedLists = await List.find({ boardId: copiedBoard._id }).sort({ order: 1 });
        const copiedCards = await Card.find({ boardId: copiedBoard._id }).sort({ order: 1 });
        expect(lists.map(l => l.title)).toStrictEqual(copiedLists.map(l => l.title));
        expect(cards.map(l => l.title)).toStrictEqual(copiedCards.map(l => l.title));

        const membership = await BoardMembership.findOne({
            boardId: copiedBoard._id,
            userId: testUser._id,
            role: "owner"
        });
        expect(membership).toBeTruthy();
    });
});

