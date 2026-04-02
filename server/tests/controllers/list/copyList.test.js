const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const app = require('../../../index');
const Board = require('../../../models/Board');
const List = require('../../../models/List');
const Card = require('../../../models/Card');
const {
    createTestUser,
    createTestBoard,
    createTestList,
    createTestCard,
} = require('../../helpers/generateDoc');
const { objectId } = require('../../helpers/common');

describe('POST /lists/copy/:id', () => {
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
            .post(`/api/lists/copy/${unknownId}`)
            .set('Cookie', `${cookieName}=${accessToken}`)
            .send({ rank: "0" })
        expect(res.statusCode).toBe(404);
    });

    it('should return 500 if missing required fields', async () => {
        const res = await request(app)
            .post(`/api/lists/copy/${testList._id}`)
            .set('Cookie', `${cookieName}=${accessToken}`)
            .send({})
        expect(res.statusCode).toBe(500);
    });

    it('should return 403 if user does not have access to board', async () => {
        const anotherUser = await createTestUser();
        const anotherBoard = await createTestBoard(anotherUser._id);
        const anotherList = await createTestList(anotherBoard._id);
        const res = await request(app)
            .post(`/api/lists/copy/${anotherList._id}`)
            .set('Cookie', `${cookieName}=${accessToken}`)
            .send({ rank: "1" })
        expect(res.statusCode).toBe(403);
        expect(res.body.message).toBe("You do not have permission to create lists");
    });

    it('should successfully copy list', async () => {
        const res = await request(app)
            .post(`/api/lists/copy/${testList._id}`)
            .set('Cookie', `${cookieName}=${accessToken}`)
            .send({ rank: "1" })

        const lists = await List.find({ title: testList.title })
        const cardsFromCopiedList = await Card.find({ listId: testList._id })
        const cardsFromNewList = await Card.find({ listId: { $ne: testList._id} })

        expect(lists.length).toBe(2);
        expect(cardsFromCopiedList.map(c => c.title))
            .toStrictEqual(cardsFromNewList.map(c => c.title));

        const board = await Board.findOne({});
        expect(board.listCount).toBe(2);

        expect(res.statusCode).toBe(200);
        expect(res.body.list.title).toBe(testList.title);
        expect(res.body.cards.length).toBe(10);
    });
});

