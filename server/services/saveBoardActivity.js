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
 * @property {import('mongoose').mongo.ClientSession | null} [session]
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
    session = null,
}) => {
    const activity = new BoardActivity({
        board: boardId,
        user: userId,
        docModel,
        docTitle,
        doc: docId,
        action,
        description,
    });
    await activity.save({ session });
    return activity;
};

export default saveBoardActivity;
