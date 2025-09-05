const mongoose = require('mongoose');
const List = require('../models/List.js');
const Card = require('../models/Card.js');
const Board = require('../models/Board.js');
const { lexorank } = require('../lib/lexorank.js');

const { saveList } = require('../services/listService');
const { isActionAuthorized } = require('../services/boardActionAuthorizeService');
const saveBoardActivity = require('../services/saveBoardActivity');

const getListCount = async (req, res) => {
    const { boardId } = req.params;

    const foundBoard = await Board.findById(boardId);
    if (!foundBoard) {
        return res.status(403).json({ msg: 'board not found' });
    }

    const count = await List.countDocuments({ boardId });
    return res.status(200).json({ count });
};

const addList = async (req, res) => {
    const { userId } = req.user;
    const { title, order, boardId } = req.body;

    const { authorized } = await isActionAuthorized(boardId, userId, { ownerOnly: false });
    if (!authorized) return res.status(403).json({ msg: 'unauthorized' });

    const newList = new List({
        title,
        order,
        boardId,
    });

    await newList.save();

    await saveBoardActivity({
        boardId,
        userId,
        listId: newList._id,
        action: "add new list",
        type: "list",
        description: '',
    })

    return res.status(201).json({ msg: 'new list created', newList });
}

const reorder = async (req, res) => {
    const { userId } = req.user;
    const { id } = req.params;
    const { rank, sourceIndex, destinationIndex } = req.body;

    const foundList = await List.findById(id);
    if (!foundList) return res.status(403).json({ msg: "list not found" });

    const { boardId } = foundList;
    const { authorized } = await isActionAuthorized(boardId, userId);
    if (!authorized) {
        return res.status(403).json({ msg: "unauthorized" });
    }

    if (foundList.order === rank) {
        return res.status(200).json({
            newList: foundList,
        });
    }

    foundList.order = rank;
    foundList.save();

    await saveBoardActivity({
        boardId,
        userId,
        listId: foundList._id,
        action: "update list rank",
        type: "list",
        description: `(${+sourceIndex + 1}) > (${+destinationIndex + 1})`,
    })

    res.status(200).json({ message: 'list updated', newList: foundList });
};

const updateTitle = async (req, res) => {
    const { userId } = req.user;
    const { id } = req.params;
    const { title } = req.body;

    const foundList = await List.findById(id);
    if (!foundList) return res.status(403).json({ msg: "list not found" });

    const { boardId } = foundList;
    const { authorized } = await isActionAuthorized(boardId, userId);
    if (!authorized) return res.status(403).json({ msg: "unauthorized" });

    foundList.title = title;
    foundList.save();

    res.status(200).json({ message: 'list updated', newList: foundList });
};

const deleteList = async (req, res) => {
    const { userId } = req.user;
    const { id } = req.params;

    const foundList = await List.findById(id);
    if (!foundList) return res.status(403).json({ msg: "list not found" });

    const { boardId } = foundList;
    const { authorized } = await isActionAuthorized(boardId, userId, { ownerOnly: false });
    if (!authorized) return res.status(403).json({ msg: 'unauthorized' });

    await List.findByIdAndDelete(id);

    await saveBoardActivity({
        boardId,
        userId,
        action: "delete list",
        type: "list",
        description: `list with title "${foundList.title}" deleted`,
    });

    res.status(200).json({ message: 'list deleted' });
};

const copyList = async (req, res) => {
    const { userId } = req.user;
    const { id } = req.params;
    const { rank } = req.body;

    const foundList = await List.findById(id);

    if (!foundList) return res.status(403).json({ msg: "List not found" });

    const { title, boardId } = foundList;
    const { authorized } = await isActionAuthorized(boardId, userId, { ownerOnly: false });
    if (!authorized) {
        return res.status(403).json({ msg: 'unauthorized' });
    }

    const newListId = new mongoose.Types.ObjectId();

    const listData = {
        _id: newListId,
        title,
        order: rank,
        boardId,
    };

    const list = await saveList(listData);

    const copiedCards = await Card.find({ listId: id });
    const newCards = [];

    for (const card of copiedCards) {
        const { title, description, order, highlight } = card;
        const newCard = new Card({
            title,
            description,
            order,
            highlight,
            listId: list._id,
            boardId: list.boardId
        });

        await newCard.save();
        newCards.push(newCard);
    }

    await saveBoardActivity({
        boardId,
        userId,
        listId: foundList._id,
        action: "copy list",
        type: "list",
        description: `[important] create a copy of list with title "${foundList.title}"`,
    })

    res.status(200).json({ list, cards: newCards, message: 'list copied' });
};

const moveList = async (req, res) => {
    const { userId } = req.user;
    const { id, boardId, index } = req.params;

    const foundList = await List.findById(id);
    if (!foundList) return res.status(403).json({ msg: "List not found" });

    const { board, authorized } = await isActionAuthorized(boardId, userId, { ownerOnly: false });
    if (!authorized) return res.status(403).json({ msg: 'unauthorized' });

    const sortedLists = await List.find({ boardId }).sort({ order: 'asc' });
    const [newOrder, ok] = lexorank.insert(sortedLists[+index - 1]?.order, sortedLists[+index]?.order);

    if (!ok) {
        return res.status(403).send('Bad Request');
    }

    foundList.order = newOrder;
    foundList.boardId = board._id;
    await foundList.save();

    await Card.updateMany({ listId: id }, { boardId });
    const newCards = await Card.find({ listId: id, boardId }).sort({ order: 'asc' });

    return res.status(200).json({ list: foundList, cards: newCards });
};

module.exports = {
    getListCount,
    addList,
    updateTitle,
    deleteList,
    copyList,
    reorder,
    moveList,
};
