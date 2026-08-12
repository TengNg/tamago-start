import User from '../models/User.js';
import Board from '../models/Board.js';
import BoardMembership from '../models/BoardMembership.js';
import bcrypt from 'bcryptjs';
import { isValidUsername } from '../services/usernameValidationService.js';
import { sanitizeUser } from '../services/userService.js';
import { sendAuthCookies, clearAuthCookies } from '../services/createAuthTokensService.js';

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const getCurrentUser = async (req, res) => {
    const { userId } = req.user;
    const user = await User.findById(userId).select('-password -refreshTokenVersion');
    if (!user) {
        return res.sendStatus(404);
    }

    res.json({ user: sanitizeUser(user) });
}

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const updateUsername = async (req, res) => {
    const { userId } = req.user;
    const { newUsername } = req.body;

    const user = await User.findById(userId);
    if (!user) {
        return res.sendStatus(404);
    }

    if (!isValidUsername(newUsername)) {
        return res.status(422).json({ message: "Invalid username" });
    }

    const foundUser = await User.findOne({
        username: newUsername.trim().toLowerCase(),
        _id: { $ne: userId },
    });
    if (foundUser) {
        return res.status(409).json({ message: "Username is already exists" });
    }

    user.username = newUsername.trim().toLowerCase();
    await user.save();

    sendAuthCookies(res, {
        userId: user._id.toString(),
        username: user.username,
        refreshTokenVersion: user.refreshTokenVersion,
    });

    res.sendStatus(204);
}

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const updatePassword = async (req, res) => {
    const { userId } = req.user;
    const { currentPassword, newPassword } = req.body;

    if (!newPassword) {
        return res.status(400).json({
            message: 'Please provide new password',
        })
    }

    const foundUser = await User.findById(userId);
    if (!foundUser) {
        return res.sendStatus(404);
    }

    if (foundUser.discordId) {
        const errMsg = "Logged in with discord, cannot change password"
        return res.status(400).json({ message: errMsg });
    }

    const validPwd = await bcrypt.compare(currentPassword, foundUser.password);
    if (!validPwd) {
        return res.status(422).json({ message: "Incorrect password" });
    }

    if (newPassword === currentPassword) {
        return res.status(422).json({
            message: "New password is the same as current password",
        });
    }

    if (newPassword.length < 8) {
        return res.status(422).json({
            message: "Password must be at least 8 characters",
        });
    }

    const hashedPwd = await bcrypt.hash(newPassword, 10);
    foundUser.password = hashedPwd;
    foundUser.refreshTokenVersion = (foundUser.refreshTokenVersion || 0) + 1;
    await foundUser.save();

    clearAuthCookies(res);

    res.sendStatus(204);
};

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const addPinnedBoard = async (req, res) => {
    const { userId } = req.user;
    const { id } = req.params;

    const foundUser = await User.findById(userId);
    if (!foundUser) {
        return res.sendStatus(404);
    }

    const board = await Board.findById(id);
    if (!board) {
        return res.status(422).json({ message: "Board does not exist" });
    }

    const isMember = await BoardMembership.exists({ boardId: board._id, userId });
    const isPublic = board.visibility === 'public';
    const isOwner = board.createdBy.toString() === userId;
    if (!isMember && !isPublic && !isOwner) {
        return res.status(403).json({ message: "you do not have access to this board" });
    }

    if (foundUser.pinnedBoardIdCollection && foundUser.pinnedBoardIdCollection.has(id)) {
        const result = await User.findOneAndUpdate(
            { _id: userId },
            { $unset: { [`pinnedBoardIdCollection.${id}`]: 1 } },
            { new: true }
        ).select('pinnedBoardIdCollection');
        return res.status(200).json({ pinnedBoards: result.pinnedBoardIdCollection });
    }

    const result = await User.findOneAndUpdate(
        { _id: userId },
        { $set: { [`pinnedBoardIdCollection.${id}`]: { title: board.title } } },
        { new: true, upsert: true }
    ).select('pinnedBoardIdCollection');

    return res.status(200).json({ pinnedBoards: result.pinnedBoardIdCollection });
};

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const deletePinnedBoard = async (req, res) => {
    const { userId } = req.user;
    const { id } = req.params;

    const foundUser = await User.findById(userId);
    if (!foundUser) {
        return res.status(403).json({ message: "user not found" });
    }

    if (foundUser.pinnedBoardIdCollection && foundUser.pinnedBoardIdCollection.has(id)) {
        const result = await User.findOneAndUpdate(
            { _id: userId },
            { $unset: { [`pinnedBoardIdCollection.${id}`]: 1 } },
            { new: true }
        ).select('pinnedBoardIdCollection');
        return res.status(200).json({ pinnedBoards: result.pinnedBoardIdCollection });
    }

    return res.sendStatus(404);
};

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const updatePinnedBoards = async (req, res) => {
    const { userId } = req.user;
    const { pinnedBoards } = req.body;

    const foundUser = await User.findById(userId);
    if (JSON.stringify(foundUser.pinnedBoardIdCollection) === JSON.stringify(pinnedBoards)) {
        return res.status(200).json({
            pinnedBoards: foundUser.pinnedBoardIdCollection,
        });
    }

    const result = await User.findOneAndUpdate(
        { _id: userId },
        { pinnedBoardIdCollection: pinnedBoards },
        { new: true }
    ).select('pinnedBoardIdCollection');

    return res.status(200).json({ pinnedBoards: result.pinnedBoardIdCollection });
};

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const cleanPinnedBoards = async (req, res) => {
    const { userId } = req.user;
    await User.findOneAndUpdate(
        { _id: userId },
        { pinnedBoardIdCollection: {} },
        { new: true }
    ).select('pinnedBoardIdCollection');

    return res.sendStatus(204);
};

export {
    getCurrentUser,
    updateUsername,
    updatePassword,
    addPinnedBoard,
    deletePinnedBoard,
    updatePinnedBoards,
    cleanPinnedBoards,
}
