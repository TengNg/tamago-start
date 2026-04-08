import mongoose from 'mongoose';
import Chat from "../models/Chat.js";
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

    const { perPage, page } = req.query;
    const perPageNum = typeof perPage === 'string' ? parseInt(perPage, 10) : 10;
    const pageNum = typeof page === 'string' ? parseInt(page, 10) : 1;

    const foundBoard = await boardById(boardId);
    if (!foundBoard) return res.status(400).json({ message: "cannot fetch chat, board not found" });

    const messages = await Chat
        .find({ boardId })
        .sort({ createdAt: 'desc' })
        .skip((pageNum - 1) * perPageNum)
        .limit(perPageNum)
        .populate({
            path: 'sentBy',
            select: 'username'
        });

    res.json({ messages });
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

    const chat = new Chat({
        sentBy: userId,
        trackedId,
        boardId,
        content,
    });

    const hasCardCodePreffix = chat.content.startsWith("!c ");
    const hasBoardCodePreffix = chat.content.startsWith("!b ");
    const type = hasCardCodePreffix ? 'CARD_CODE' : hasBoardCodePreffix ? 'BOARD_CODE' : 'MESSAGE';

    const isValidCode = mongoose.Types.ObjectId.isValid(chat.content.split(" ")[1]);
    if (isValidCode) chat.type = type;

    await chat.save();

    res.status(200).json({ message: "message is sent", chat });
};

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const deleteMessage = async (req, res) => {
    const { trackedId } = req.params;
    const deletedMessage = await Chat.findOneAndDelete({ trackedId });
    res.status(200).json({ message: "message deleted", deletedMessage });
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

    await Chat.deleteMany({ boardId });
    res.status(200).json({ message: "messages deleted" });
};

export {
    sendMessage,
    clearMessages,
    getMessages,
    deleteMessage
};
