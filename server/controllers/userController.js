import User from '../models/User.js';
import Board from '../models/Board.js';
import bcrypt from 'bcryptjs';
import { isValidUsername } from '../services/usernameValidationService.js';
import { sanitizeUser } from '../services/userService.js';

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

    const foundUser = await User.findOne({ username: newUsername })
    if (foundUser) {
        return res.status(409).json({ message: "Username is already exists" });
    }

    if (!isValidUsername(newUsername)) {
        return res.status(422).json({ message: "Invalid username" });
    }

    user.username = newUsername;
    await user.save();

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

    const hashedPwd = await bcrypt.hash(newPassword, 10);
    foundUser.password = hashedPwd;
    await foundUser.save();

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

    const foundBoard = await Board.findById(id);
    if (!foundBoard) {
        return res.status(422).json({ message: "Board does not exist" });
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
        { $set: { [`pinnedBoardIdCollection.${id}`]: { title: foundBoard?.title } } },
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
