const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const app = require('../../../index');
const List = require('../../../models/List');
const {
    createTestUser,
    createTestBoard,
    createTestList,
    createTestCard,
} = require('../../helpers/generateDoc');
const { objectId } = require('../../helpers/common');

describe('PATCH /move/:id/b/:boardId/i/:index', () => {
    let cookieName = process.env.ACCESS_TOKEN_COOKIE_NAME;
    let accessToken;
    let testUser;

    let testBoard1;
    let testBoard2;

    let testList1;
    let testList2;
    let testList3;
    let testList4;
    let testList5;
    let testList6;
    let testList7;

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

        testBoard1 = await createTestBoard(
            testUser._id, { title: "test board 1" }
        );
        testBoard2 = await createTestBoard(
            testUser._id, { title: "test board 2" }
        );

        // board1's lists
        testList1 = await createTestList(
            testBoard1._id, { title: "test list 1", order: "a" }
        );
        testList2 = await createTestList(
            testBoard1._id, { title: "test list 2", order: "b" }
        );
        testList3 = await createTestList(
            testBoard1._id, { title: "test list 3", order: "c" }
        );
        testList4 = await createTestList(
            testBoard1._id, { title: "test list 4", order: "d" }
        );

        // board2's lists
        testList5 = await createTestList(
            testBoard2._id, { title: "test list 5", order: "a" }
        );
        testList6 = await createTestList(
            testBoard2._id, { title: "test list 6", order: "b" }
        );
        testList7 = await createTestList(
            testBoard2._id, { title: "test list 7", order: "c" }
        );

        for (let i = 1; i <= 5; i++) {
            await createTestCard(
                testBoard1._id,
                testList1._id,
                { title: `card ${i} from ${testBoard1.title}` }
            );
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
        const indexToMove = 2;
        const unknownId = objectId();
        const res = await request(app)
            .patch(`/api/lists/move/${unknownId}/b/${testBoard2._id}/i/${indexToMove}`)
            .set('Cookie', `${cookieName}=${accessToken}`)
        expect(res.statusCode).toBe(404);
    });

    it('should successfully move list in the same board', async () => {
        const indexToMove = 0;
        const res = await request(app)
            .patch(`/api/lists/move/${testList1._id}/b/${testBoard1._id}/i/${indexToMove}`)
            .set('Cookie', `${cookieName}=${accessToken}`)
        expect(res.statusCode).toBe(200);

        const lists = await List.find({ boardId: testBoard1._id }).sort({ order: 1 });
        const movedListIndex = lists.findIndex(l => {
            return l._id.toString() == testList1._id.toString()
        });
        expect(movedListIndex).toBe(indexToMove);
    });

    it('should successfully move list to a different board', async () => {
        const indexToMove = 2;
        const res = await request(app)
            .patch(`/api/lists/move/${testList1._id}/b/${testBoard2._id}/i/${indexToMove}`)
            .set('Cookie', `${cookieName}=${accessToken}`)
        expect(res.statusCode).toBe(200);

        const listsFromBoard1 = await List.find({ boardId: testBoard1._id }).sort({ order: 1 });
        expect(listsFromBoard1.length).toBe(3);

        const listsFromBoard2 = await List.find({ boardId: testBoard2._id }).sort({ order: 1 });
        expect(listsFromBoard2.length).toBe(4);

        const movedListIndex = listsFromBoard2.findIndex(l => {
            return l._id.toString() == testList1._id.toString()
        });
        expect(movedListIndex).toBe(indexToMove);
    });
});

