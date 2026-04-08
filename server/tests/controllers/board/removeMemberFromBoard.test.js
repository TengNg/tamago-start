import request from 'supertest';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import app from '../../../index.js';
import {
    createTestUser,
    createTestBoard,
    createTestBoardMembership,
} from '../../helpers/generateDoc.js';
import { objectId } from '../../helpers/common.js';

describe('DELETE /boards/:id/members/:memberName (removeMemberFromBoard)', () => {
    let cookieName = process.env.ACCESS_TOKEN_COOKIE_NAME;
    let accessToken;
    let testUser;
    let anotherUser;
    let memberUser;
    let ownedBoard;

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
        memberUser = await createTestUser({ username: 'testmember123' });

        // Board owned by testUser (auto owner membership)
        ownedBoard = await createTestBoard(testUser._id, { title: "Test Board" });

        // Add a regular member
        await createTestBoardMembership(ownedBoard._id, memberUser._id, 'member');

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
            .delete(`/api/boards/${unknownId}/members/testmember123`)
            .set('Cookie', `${cookieName}=${accessToken}`);

        expect(res.statusCode).toBe(404);
    });

    it('should return 403 if user is not the owner', async () => {
        // anotherUser is not owner
        const anotherToken = jwt.sign(
            {
                userId: anotherUser._id.toString(),
                username: anotherUser.username,
                refreshTokenVersion: anotherUser.refreshTokenVersion || 0,
            },
            process.env.ACCESS_TOKEN_SECRET || 'testsecret',
            { expiresIn: '1h' }
        );

        const res = await request(app)
            .delete(`/api/boards/${ownedBoard._id}/members/testmember123`)
            .set('Cookie', `${cookieName}=${anotherToken}`);

        expect(res.statusCode).toBe(403);
    });

    it('should return 403 if memberName does not exist', async () => {
        const res = await request(app)
            .delete(`/api/boards/${ownedBoard._id}/members/nonexistentuser`)
            .set('Cookie', `${cookieName}=${accessToken}`);

        expect(res.statusCode).toBe(403);
        expect(res.body.message).toBe('member not found');
    });

    it('should return 403 if trying to remove yourself', async () => {
        const res = await request(app)
            .delete(`/api/boards/${ownedBoard._id}/members/${testUser.username}`)
            .set('Cookie', `${cookieName}=${accessToken}`);

        expect(res.statusCode).toBe(403);
        expect(res.body.message).toBe('cannot remove yourself');
    });

    it('should successfully remove a member', async () => {
        const res = await request(app)
            .delete(`/api/boards/${ownedBoard._id}/members/testmember123`)
            .set('Cookie', `${cookieName}=${accessToken}`);

        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({ message: 'Member removed from the board successfully' });
    });
});
