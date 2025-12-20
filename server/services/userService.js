const User = require('../models/User');

/**
 * @param {string} username
 * @param {Object} [option={ lean: true }]
 * @param {boolean} [option.lean=true]
 */
const userByUsername = (username, option = { lean: true }) => {
    const foundUser = User.findOne({ username });
    if (option.lean) foundUser.lean();
    return foundUser;
};


/**
 * @param {Object} user
 * @param {string|import('mongoose').Types.ObjectId} user._id
 * @param {string} user.username
 * @param {Date} user.createdAt
 * @param {string|import('mongoose').Types.ObjectId|null} [user.recentlyViewedBoardId]
 * @param {Map<string, any>|null} [user.pinnedBoardIdCollection]
 * @param {string|null} [user.discordId]
 */
const sanitizeUser = (user) => {
    const {
        _id,
        username,
        createdAt,
        recentlyViewedBoardId,
        pinnedBoardIdCollection,
        discordId,
    } = user;

    const data = {
        _id,
        username,
        createdAt,
        recentlyViewedBoardId,
        pinnedBoardIdCollection: pinnedBoardIdCollection ? Object.fromEntries(pinnedBoardIdCollection) : {},
        loginWithDiscord: !!discordId,
    }

    return data;
};

module.exports = {
    userByUsername,
    sanitizeUser,
};
