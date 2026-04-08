import request from 'supertest';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import app from '../../../index.js';
import {
    createTestUser,
    createTestBoard,
    createTestList,
    createTestCard,
    createTestWritedown,
} from '../../helpers/generateDoc.js';
import { objectId } from '../../helpers/common.js';

import path from 'path';
const filePath = path.join(path.dirname(import.meta.url.replace('file://', '')), '../../fixtures/test-image.png');

describe('POST /api/attachments/upload', () => {
    let cookieName = process.env.ACCESS_TOKEN_COOKIE_NAME;
    let accessToken;
    let testUser;
    let testBoard;
    let testList;
    let testCard;

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

    it('should return 422 if upload type is invalid', async () => {
        const unknownId = objectId();
        const res = await request(app)
            .post('/api/attachments/upload')
            .set('Cookie', `${cookieName}=${accessToken}`)
            .send({
                type: 'invalid type',
                refId: unknownId,
            });

        expect(res.statusCode).toBe(422);
    });

    it('should successfully upload a valid file for a card', async () => {
        const res = await request(app)
            .post('/api/attachments/upload')
            .set('Cookie', `${cookieName}=${accessToken}`)
            .attach('attachment', filePath)
            .field('docModel', 'Card')
            .field('doc', testCard._id.toString());

        expect(res.statusCode).toBe(201);
    });

    it('should successfully upload a valid file for a writedown', async () => {
        const testWritedown = await createTestWritedown(testUser._id);
        const res = await request(app)
            .post('/api/attachments/upload')
            .set('Cookie', `${cookieName}=${accessToken}`)
            .attach('attachment', filePath)
            .field('docModel', 'Writedown')
            .field('doc', testWritedown._id.toString());

        expect(res.statusCode).toBe(201);
    });

    it('should return 422 when no file is attached', async () => {
        const res = await request(app)
            .post('/api/attachments/upload')
            .set('Cookie', `${cookieName}=${accessToken}`)
            .field('docModel', 'Card')
            .field('doc', testCard._id.toString());

        expect(res.statusCode).toBe(422);
        expect(res.body.message).toBe("Invalid or missing attachment file");
    });

    it('should reject blocked file extensions (fileFilter)', async () => {
        const res = await request(app)
            .post('/api/attachments/upload')
            .set('Cookie', `${cookieName}=${accessToken}`)
            .attach('attachment', filePath, 'blocked.exe')
            .field('type', 'card')
            .field('refId', testCard._id.toString());

        expect(res.statusCode).toBe(500);
        expect(res.body.message).toBe('File blocked for security reasons - dangerous type detected');
    });

    it('should reject files that are too large', async () => {
        const largeBuffer = Buffer.alloc(1024 * 1024 * 11);

        const res = await request(app)
            .post('/api/attachments/upload')
            .set('Cookie', `${cookieName}=${accessToken}`)
            .attach('attachment', largeBuffer, 'large.jpg')
            .field('docModel', 'Card')
            .field('doc', testCard._id.toString());

        expect(res.body.message).toBe('File too large');
    });
});
