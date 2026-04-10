import mongoose from 'mongoose';
import ChatMessage from "../models/ChatMessage.js";
import Board from "../models/Board.js";

/**
 * @param {string} boardId
 */
const boardById = (boardId) => {
    const foundBoard = Board.findById(boardId).lean();
    return foundBoard;
};

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const getMessages = async (req, res) => {
    const { boardId } = req.params;
    const limit = typeof req.query.limit === 'string' ? parseInt(req.query.limit) : 20;
    const before = typeof req.query.before === 'string' && req.query.before;

    const foundBoard = await boardById(boardId);
    if (!foundBoard) {
        return res.status(404);
    }

    let query = { boardId };
    if (before) {
        query.createdAt = { $lt: new Date(before) };
    }

    const messages = await ChatMessage
        .find(query)
        .sort({ createdAt: "desc" })
        .limit(limit)
        .populate({
            path: 'sentBy',
            select: 'username'
        });

    const hasMore = messages.length === limit;
    const nextCursor = hasMore
        ? messages[messages.length - 1].createdAt.toISOString()
        : null;

    res.json({
        messages,
        nextCursor,
        hasMore
    });
};

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const sendMessage = async (req, res) => {
    const { userId } = req.user;
    const { content, trackedId } = req.body;
    const { boardId } = req.params;

    const foundBoard = await boardById(boardId);
    if (!foundBoard) return res.status(403).json({ message: "cannot send message, board not found" });

    const chatMessage = new ChatMessage({
        sentBy: userId,
        trackedId,
        boardId,
        content,
    });

    const hasCardCodePreffix = chatMessage.content.startsWith("!c ");
    const hasBoardCodePreffix = chatMessage.content.startsWith("!b ");
    const type = hasCardCodePreffix ? 'CARD_CODE' : hasBoardCodePreffix ? 'BOARD_CODE' : 'MESSAGE';

    const isValidCode = mongoose.Types.ObjectId.isValid(chatMessage.content.split(" ")[1]);
    if (isValidCode) chatMessage.type = type;

    await chatMessage.save();

    res.status(201).json({ chatMessage });
};

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const deleteMessage = async (req, res) => {
    const { id } = req.params;
    await ChatMessage.findByIdAndDelete(id);
    res.status(204);
};

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const clearMessages = async (req, res) => {
    const { userId } = req.user;
    const { boardId } = req.params;

    const foundBoard = await boardById(boardId);
    if (!foundBoard) return res.status(403).json({ message: "cannot send message, board not found" });

    if (foundBoard.createdBy.toString() !== userId) {
        return res.status(401).json({ message: 'Not authorize' });
    }

    await ChatMessage.deleteMany({ boardId });
    res.status(200).json({ message: "messages deleted" });
};

export {
    sendMessage,
    clearMessages,
    getMessages,
    deleteMessage
};
