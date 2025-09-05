const mongoose = require('mongoose');

const Chat = require("../models/Chat");
const Board = require("../models/Board");

const boardById = (boardId) => {
    const foundBoard = Board.findById(boardId).lean();
    return foundBoard;
};

const getMessages = async (req, res) => {
    const { boardId } = req.params;

    let { perPage, page } = req.query;

    perPage = +perPage || 10;
    page = +page || 1;

    const foundBoard = await boardById(boardId);
    if (!foundBoard) return res.status(400).json({ msg: "cannot fetch chat, board not found" });

    const messages = await Chat
        .find({ boardId })
        .sort({ createdAt: 'desc' })
        .skip((page - 1) * perPage)
        .limit(perPage)
        .populate({
            path: 'sentBy',
            select: 'username'
        });

    res.json({ messages });
};

const sendMessage = async (req, res) => {
    const { userId } = req.user;
    const { content, trackedId } = req.body;
    const { boardId } = req.params;

    const foundBoard = await boardById(boardId);
    if (!foundBoard) return res.status(403).json({ msg: "cannot send message, board not found" });

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

    res.status(200).json({ msg: "message is sent", chat });
};

const deleteMessage = async (req, res) => {
    const { trackedId } = req.params;
    const deletedMessage = await Chat.findOneAndDelete({ trackedId });
    res.status(200).json({ msg: "message deleted", deletedMessage });
};

const clearMessages = async (req, res) => {
    const { userId } = req.user;
    const { boardId } = req.params;

    const foundBoard = await boardById(boardId);
    if (!foundBoard) return res.status(403).json({ msg: "cannot send message, board not found" });

    if (foundBoard.createdBy.toString() !== userId) {
        return res.status(401).json({ msg: 'Not authorize' });
    }

    await Chat.deleteMany({ boardId });
    res.status(200).json({ msg: "messages deleted" });
};

module.exports = {
    sendMessage,
    clearMessages,
    getMessages,
    deleteMessage
};
