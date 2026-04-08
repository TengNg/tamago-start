import request from 'supertest';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import app from '../../../index.js';
import {
    createTestUser,
    createTestBoard,
    createTestBoardMembership,
} from '../../helpers/generateDoc.js';

describe('GET /boards', () => {
    let cookieName = process.env.ACCESS_TOKEN_COOKIE_NAME;
    let accessToken;
    let testUser;

    let ownedBoard1;
    let ownedBoard2;
    let joinedBoard;
    let anotherUser;

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

        // Owned boards → Board creation automatically creates owner membership
        ownedBoard1 = await createTestBoard(testUser._id, { title: "Alpha Board" });
        ownedBoard2 = await createTestBoard(testUser._id, { title: "Charlie Board" });

        // Joined board (owned by another user)
        anotherUser = await createTestUser();
        joinedBoard = await createTestBoard(anotherUser._id, { title: "Beta Board" });

        // Only need to create membership for testUser on the joined board
        await createTestBoardMembership(joinedBoard._id, testUser._id, 'member');

        // Set recently viewed board (must have membership - already exists for ownedBoard1)
        testUser.recentlyViewedBoardId = ownedBoard1._id;
        await testUser.save();

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

    it('should return empty result when user has no boards', async () => {
        const noBoardUser = await createTestUser();
        const noBoardToken = jwt.sign(
            {
                userId: noBoardUser._id.toString(),
                username: noBoardUser.username,
                refreshTokenVersion: noBoardUser.refreshTokenVersion || 0,
            },
            process.env.ACCESS_TOKEN_SECRET || 'testsecret',
            { expiresIn: '1h' }
        );

        const res = await request(app)
            .get('/api/boards')
            .set('Cookie', `${cookieName}=${noBoardToken}`);

        expect(res.statusCode).toBe(200);

        const { boards, total, totalOwned, totalJoined, recentlyViewedBoard } = res.body;

        expect(boards).toEqual([]);
        expect(total).toBe(0);
        expect(totalOwned).toBe(0);
        expect(totalJoined).toBe(0);
        expect(recentlyViewedBoard).toBeNull();
    });

    it('should return all boards sorted by title when no filter is provided', async () => {
        const res = await request(app)
            .get('/api/boards')
            .set('Cookie', `${cookieName}=${accessToken}`);

        expect(res.statusCode).toBe(200);

        const { boards, total, totalOwned, totalJoined, recentlyViewedBoard } = res.body;

        expect(boards).toHaveLength(3);

        // Sorted by title ascending (Alpha → Beta → Charlie)
        const titles = boards.map(b => b.title);
        expect(titles).toStrictEqual(['Alpha Board', 'Beta Board', 'Charlie Board']);

        // owned flags
        expect(boards[0].owned).toBe(true);   // Alpha - owned
        expect(boards[1].owned).toBe(false);  // Beta - joined
        expect(boards[2].owned).toBe(true);   // Charlie - owned

        // memberCount (auto-created owner membership + joined membership)
        expect(boards[0].memberCount).toBe(1); // only owner
        expect(boards[1].memberCount).toBe(2); // owner + testUser
        expect(boards[2].memberCount).toBe(1); // only owner

        // Totals
        expect(total).toBe(3);
        expect(totalOwned).toBe(2);
        expect(totalJoined).toBe(1);

        // recentlyViewedBoard
        expect(recentlyViewedBoard).not.toBeNull();
        expect(recentlyViewedBoard._id.toString()).toBe(ownedBoard1._id.toString());
        expect(recentlyViewedBoard.title).toBe('Alpha Board');
    });

    it('should return only owned boards when filter=owned', async () => {
        const res = await request(app)
            .get('/api/boards')
            .query({ filter: 'owned' })
            .set('Cookie', `${cookieName}=${accessToken}`);

        expect(res.statusCode).toBe(200);

        const { boards, total, totalOwned, totalJoined } = res.body;

        expect(boards).toHaveLength(2);

        const titles = boards.map(b => b.title);
        expect(titles).toStrictEqual(['Alpha Board', 'Charlie Board']);

        expect(boards.every(b => b.owned)).toBe(true);
        expect(boards[0].memberCount).toBe(1);
        expect(boards[1].memberCount).toBe(1);

        expect(total).toBe(3);        // total is always for all boards
        expect(totalOwned).toBe(2);
        expect(totalJoined).toBe(1);
    });

    it('should return only joined boards when filter=joined', async () => {
        const res = await request(app)
            .get('/api/boards')
            .query({ filter: 'joined' })
            .set('Cookie', `${cookieName}=${accessToken}`);

        expect(res.statusCode).toBe(200);

        const { boards, total, totalOwned, totalJoined } = res.body;

        expect(boards).toHaveLength(1);

        expect(boards[0].title).toBe('Beta Board');
        expect(boards[0].owned).toBe(false);
        expect(boards[0].memberCount).toBe(2);

        expect(total).toBe(3);
        expect(totalOwned).toBe(2);
        expect(totalJoined).toBe(1);
    });
});
