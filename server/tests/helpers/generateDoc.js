const User = require('../../models/User');
const Board = require('../../models/Board');
const List = require('../../models/List');
const Card = require('../../models/Card');

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

module.exports = {
    createTestUser,
    createTestBoard,
    createTestList,
    createTestCard,
    initializeTestDocs,
};
