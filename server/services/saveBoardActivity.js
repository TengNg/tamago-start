import BoardActivity from '../models/BoardActivity.js';

/**
 * @typedef {object} Params
 * @property {string} userId
 * @property {string | import('mongoose').Types.ObjectId} boardId
 * @property {string | import('mongoose').Types.ObjectId} [docId]
 * @property {Date | NativeDate | undefined} [createdAt]
 * @property {string} [description]
 * @property {string} action
 * @property {'Board' | 'List' | 'Card'} docModel
 * @property {string} docTitle
 */

/**
 * @param {Params} params
 */
const saveBoardActivity = async ({
    boardId,
    userId,
    docId,
    docModel,
    docTitle = "",
    action,
    description,
}) => {
    const activity = await BoardActivity.create({
        board: boardId,
        user: userId,
        docModel,
        docTitle,
        doc: docId,
        action,
        description,
    });
    return activity;
};

export default saveBoardActivity;
