import User from '../../models/User.js';
import Board from '../../models/Board.js';
import List from '../../models/List.js';
import Card from '../../models/Card.js';
import Writedown from '../../models/Writedown.js';
import BoardMembership from '../../models/BoardMembership.js';
import Attachment from '../../models/Attachment.js';
import ChatMessage from '../../models/ChatMessage.js';
import fs from 'fs';

async function createTestUser(overrides = {}) {
    const user = new User({
        username: overrides.username || `user${Date.now()}`,
        password: overrides.password || 'testPassword123',
        ...overrides
    });
    await user.save();
    return user;
}

async function createTestBoard(userId, overrides = {}) {
    const board = new Board({
        title: overrides.title || `Board ${Date.now()}`,
        description: overrides.description || '',
        visibility: overrides.visibility || 'private',
        createdBy: userId,
        ...overrides
    });
    await board.save();
    return board;
}

async function createTestList(boardId, overrides = {}) {
    const list = new List({
        title: overrides.title || `List ${Date.now()}`,
        boardId,
        order: Math.random().toString(36).substring(2, 10),
        ...overrides
    });
    await list.save();
    return list;
}

async function createTestCard(boardId, listId, overrides = {}) {
    const card = new Card({
        title: overrides.title || `Card ${Date.now()}`,
        boardId,
        listId,
        order: Math.random().toString(36).substring(2, 10),
        ...overrides
    });
    await card.save();
    return card;
}

async function createTestBoardMembership(boardId, userId, role = 'owner') {
    const membership = new BoardMembership({
        boardId,
        userId,
        role
    });
    await membership.save();
    return membership;
}

async function initializeTestDocs() {
    const testUser = await createTestUser();
    const testBoard = await createTestBoard(testUser._id);
    const testList = await createTestList(testBoard._id);
    const testCard = await createTestCard(testBoard._id, testList._id);
    return {
        user: testUser,
        board: testBoard,
        list: testList,
        card: testCard,
    }
}

async function createTestWritedown(userId, overrides = {}) {
    const writedown = new Writedown({
        owner: userId,
        title: overrides.title || `Writedown ${Date.now()}`,
        content: overrides.content || '',
        order: overrides.order ?? Math.random().toString(36).substring(2, 10),
        pinned: overrides.pinned ?? false,
        ...overrides
    });
    await writedown.save();
    return writedown;
}

async function createTestAttachment(docModel = "Card", doc, filePath) {
    const buffer = fs.readFileSync(filePath);
    const attachment = new Attachment({
        docModel,
        doc,
        data: buffer,
        mimetype: "image/png",
        originalname: "test-image.png"
    });
    await attachment.save();
    return attachment;
}

async function createTestChatMessage(boardId, sentBy, content) {
    const chatMessage = new ChatMessage({
        sentBy,
        boardId,
        content,
    });
    await chatMessage.save();
    return chatMessage;
}

export {
    createTestUser,
    createTestBoard,
    createTestList,
    createTestCard,
    createTestWritedown,
    createTestBoardMembership,
    initializeTestDocs,
    createTestAttachment,
    createTestChatMessage,
};
