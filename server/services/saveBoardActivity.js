const { Types } = require('mongoose');
const BoardActivity = require('../models/BoardActivity');

/**
 * @typedef {object} Params
 * @property {string} userId
 * @property {string | Types.ObjectId} boardId
 * @property {string | Types.ObjectId} [listId]
 * @property {string | Types.ObjectId} [cardId]
 * @property {Date | NativeDate | undefined} [createdAt]
 * @property {string} [description]
 * @property {string} action
 * @property {string} type
 */

/**
 * @param {Params} params
 */
const saveBoardActivity = async ({ boardId, userId, listId, cardId, action, createdAt, description, type }) => {
    if (!createdAt) {
        createdAt = new Date();
    }

    if (typeof boardId === "object") {
        boardId = boardId.toString();
    }

    if (typeof listId === "object") {
        listId = listId.toString();
    }

    if (typeof cardId === "object") {
        cardId = cardId.toString();
    }

    try {
        const newActivity = new BoardActivity({
            board: boardId,
            user: userId,
            card: cardId,
            list: listId,
            type,
            action,
            description,
            createdAt,
        });

        const savedActivity = await newActivity.save();
        return savedActivity;
    } catch (error) {
        console.log(error);
        return null;
    }
};

module.exports = saveBoardActivity;
