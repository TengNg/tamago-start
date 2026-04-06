const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const app = require('../../../index');
const {
    createTestUser,
    createTestBoard,
    createTestList,
    createTestCard,
    createTestAttachment,
} = require('../../helpers/generateDoc');
const { objectId } = require('../../helpers/common');

const path = require('path');
const filePath = path.join(__dirname, '../../fixtures/test-image.png');

describe('GET /api/attachments/:doc/:docModel', () => {
    let cookieName = process.env.ACCESS_TOKEN_COOKIE_NAME;
    let accessToken;
    let testUser;
    let testBoard;
    let testList;
    let testCard;
    let testAttachment;

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
        testCard = await createTestCard(testBoard._id, testList._id);
        testAttachment = await createTestAttachment('Card', testCard._id, filePath);
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

    it('should return 403 if id is not found', async () => {
        const unknownId = objectId();
        const res = await request(app)
            .get(`/api/attachments/${unknownId}/Card`)
            .set('Cookie', `${cookieName}=${accessToken}`)

        expect(res.statusCode).toBe(403);
    });

    it('should return 422 if docModel is invalid', async () => {
        const invalidDocModel = "Invalid";
        const res = await request(app)
            .get(`/api/attachments/${testCard._id}/${invalidDocModel}`)
            .set('Cookie', `${cookieName}=${accessToken}`)

        expect(res.statusCode).toBe(422);
    });

    it('should successfully get the attachments', async () => {
        const res = await request(app)
            .get(`/api/attachments/${testCard._id}/Card`)
            .set('Cookie', `${cookieName}=${accessToken}`)

        expect(res.statusCode).toBe(200);
    });
});
