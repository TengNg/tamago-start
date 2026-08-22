import User from '../models/User.js';
import Board from '../models/Board.js';
import BoardMembership from '../models/BoardMembership.js';
import bcrypt from 'bcryptjs';
import { isValidUsername } from '../services/usernameValidationService.js';
import { sendAuthCookies, clearAuthCookies } from '../services/createAuthTokensService.js';
import { generatePinnedBoardOrder } from '../services/pinnedBoardService.js';

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const getCurrentUser = async (req, res) => {
    const { userId } = req.user;
    const user = await User.findById(userId)
        .select('-password -refreshTokenVersion -__v')
        .populate('pinnedBoards.board', 'title');
    if (!user) {
        return res.sendStatus(404);
    }

    res.json(user);
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

    if (
        typeof currentPassword !== 'string' ||
        typeof newPassword !== 'string' ||
        !currentPassword ||
        !newPassword
    ) {
        return res.status(400).json({
            message: 'Please provide current and new password',
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
        return res.status(403).json({ message: "You do not have access to this board" });
    }

    const alreadyPinned = foundUser.pinnedBoards.some(
        (p) => p.board.equals(board._id)
    );

    if (alreadyPinned) {
        foundUser.pinnedBoards.pull({ board: board._id });
    } else {
        const sorted = [...foundUser.pinnedBoards].sort((a, b) =>
            a.order.localeCompare(b.order)
        );
        const last = sorted[sorted.length - 1];
        const order = generatePinnedBoardOrder({
            user: foundUser,
            prevBoardId: last?.board.toString() ?? null,
            nextBoardId: null,
        });
        foundUser.pinnedBoards.push({
            board: board._id,
            pinnedAt: new Date(),
            order,
        });
    }

    await foundUser.save();
    await foundUser.populate('pinnedBoards.board', 'title');

    return res.status(200).json({ pinnedBoards: foundUser.pinnedBoards });
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
        return res.sendStatus(404);
    }

    const entry = foundUser.pinnedBoards.find((p) => p.board.equals(id));
    if (!entry) {
        return res.sendStatus(404);
    }

    foundUser.pinnedBoards.pull({ board: entry.board });
    await foundUser.save();
    await foundUser.populate('pinnedBoards.board', 'title');

    return res.status(200).json({ pinnedBoards: foundUser.pinnedBoards });
};

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const reorderPinnedBoard = async (req, res) => {
    const { userId } = req.user;
    const { id } = req.params;
    const { prevBoardId, nextBoardId } = req.body;

    const foundUser = await User.findById(userId);
    if (!foundUser) {
        return res.sendStatus(404);
    }

    const entry = foundUser.pinnedBoards.find((p) => p.board.equals(id));
    if (!entry) {
        return res.sendStatus(404);
    }

    entry.order = generatePinnedBoardOrder({
        user: foundUser,
        prevBoardId: prevBoardId || null,
        nextBoardId: nextBoardId || null,
    });

    await foundUser.save();
    await foundUser.populate('pinnedBoards.board', 'title');

    return res.status(200).json({ pinnedBoards: foundUser.pinnedBoards });
};

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const cleanPinnedBoards = async (req, res) => {
    const { userId } = req.user;
    await User.findOneAndUpdate(
        { _id: userId },
        { pinnedBoards: [] },
        { new: true }
    ).select('pinnedBoards');

    return res.sendStatus(204);
};

export {
    getCurrentUser,
    updateUsername,
    updatePassword,
    addPinnedBoard,
    deletePinnedBoard,
    reorderPinnedBoard,
    cleanPinnedBoards,
}
