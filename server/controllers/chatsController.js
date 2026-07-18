import mongoose from 'mongoose';
import ChatMessage from "../models/ChatMessage.js";
import Board from "../models/Board.js";
import BoardMembership from "../models/BoardMembership.js";

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const getMessages = async (req, res) => {
    const { boardId } = req.params;
    const limit = typeof req.query.limit === 'string' ? parseInt(req.query.limit) : 20;
    const before = typeof req.query.before === 'string' && req.query.before;

    const foundBoard = await Board.findById(boardId).lean();
    if (!foundBoard) {
        return res.sendStatus(404);
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
            select: '_id username'
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
    const { content } = req.body;
    const { boardId } = req.params;

    const foundBoard = await Board.findById(boardId).lean();
    if (!foundBoard) {
        return res.sendStatus(404);
    }

    const chatMessage = new ChatMessage({
        sentBy: userId,
        boardId,
        content,
    });

    const hasCardCodePreffix = chatMessage.content.startsWith("!c ");
    const hasBoardCodePreffix = chatMessage.content.startsWith("!b ");
    const type = hasCardCodePreffix ? 'CARD_CODE' : hasBoardCodePreffix ? 'BOARD_CODE' : 'MESSAGE';

    const isValidCode = (
        ["CARD_CODE", "BOARD_CODE"].includes(type)
        && mongoose.Types.ObjectId.isValid(chatMessage.content.split(" ")[1])
    )
    if (isValidCode) {
        chatMessage.type = type;
    } else {
        chatMessage.type = "MESSAGE";
    }

    await chatMessage.save()
    await chatMessage.populate({
        path: "sentBy",
        select: "_id username"
    });

    res.status(201).json({ chatMessage });
};

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const deleteMessage = async (req, res) => {
    const { userId } = req.user;
    const { id } = req.params;

    const chatMessage = await ChatMessage.findById(id);
    if (!chatMessage) {
        return res.sendStatus(404);
    }

    const membership = await BoardMembership.findOne({
        boardId: chatMessage.boardId,
        userId,
    });
    if (!membership) {
        return res.sendStatus(403);
    }

    if (membership.role !== "owner" && userId !== chatMessage.sentBy.toString()) {
        return res.sendStatus(403);
    }

    await chatMessage.deleteOne();

    res.sendStatus(204);
};

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const clearMessages = async (req, res) => {
    const { userId } = req.user;
    const { boardId } = req.params;

    const foundBoard = await Board.findById(boardId).lean();
    if (!foundBoard) {
        return res.sendStatus(404);
    }

    const isOwner = await BoardMembership.exists({
        boardId,
        userId,
        role: "owner",
    });
    if (!isOwner) {
        return res.status(403).json({ message: 'not allow to clear messages' });
    }

    await ChatMessage.deleteMany({ boardId });
    res.sendStatus(204);
};

export {
    sendMessage,
    clearMessages,
    getMessages,
    deleteMessage
};
