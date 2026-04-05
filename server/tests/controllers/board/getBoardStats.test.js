const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const app = require('../../../index');
const {
    createTestUser,
    createTestBoard,
    createTestList,
    createTestCard,
    createTestBoardMembership,
} = require('../../helpers/generateDoc');
const { objectId } = require('../../helpers/common');

describe('GET /boards/:id/stats', () => {
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

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        for (let i = 0; i < 3; i++) {
            await createTestCard(testBoard._id, testList1._id, { priorityLevel: 'high' });
        }

        // Medium priority: 4 cards (2 of them stale)
        for (let i = 0; i < 2; i++) {
            await createTestCard(testBoard._id, testList1._id, { priorityLevel: 'medium' });
        }
        for (let i = 0; i < 2; i++) {
            await createTestCard(testBoard._id, testList2._id, {
                priorityLevel: 'medium',
                dueDate: yesterday,
            });
        }

        // Low priority: 2 cards (no due date)
        for (let i = 0; i < 2; i++) {
            await createTestCard(testBoard._id, testList2._id, { priorityLevel: 'low' });
        }

        // No priorityLevel (none): 3 cards (1 of them stale)
        for (let i = 0; i < 2; i++) {
            await createTestCard(testBoard._id, testList1._id); // defaults to none
        }
        await createTestCard(testBoard._id, testList2._id, { dueDate: yesterday });

        // Total: 12 cards
        // Priority breakdown: high=3, medium=4, low=2, none=3
        // Stale cards: 3 (2 medium + 1 none)

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
            .get(`/api/boards/${unknownId}/stats`)
            .set('Cookie', `${cookieName}=${accessToken}`)
        expect(res.statusCode).toBe(404);
    });

    it('should return 403 if user is not a member', async () => {
        const anotherUser = await createTestUser();
        const anotherBoard = await createTestBoard(anotherUser._id);
        const res = await request(app)
            .get(`/api/boards/${anotherBoard._id}/stats`)
            .set('Cookie', `${cookieName}=${accessToken}`)
        expect(res.statusCode).toBe(403);
    });

    it('should successfully return board stats with multiple priority levels and stale cards', async () => {
        const res = await request(app)
            .get(`/api/boards/${testBoard._id}/stats`)
            .set('Cookie', `${cookieName}=${accessToken}`)
        expect(res.statusCode).toBe(200);

        const { board, members, priorityLevelStats, staleCardCount } = res.body;
        expect(board._id.toString()).toBe(testBoard._id.toString());
        expect(members[0].username).toBe(testUser.username);
        expect(priorityLevelStats).toHaveLength(4);

        const statsMap = priorityLevelStats.reduce((acc, stat) => {
            acc[stat._id] = stat.count;
            return acc;
        }, {});
        expect(statsMap.high).toBe(3);
        expect(statsMap.medium).toBe(4);
        expect(statsMap.low).toBe(2);
        expect(statsMap.none).toBe(3);

        expect(staleCardCount).toBe(3);
    });
});

