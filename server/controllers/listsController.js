const mongoose = require('mongoose');
const List = require('../models/List.js');
const Card = require('../models/Card.js');
const { lexorank } = require('../lib/lexorank.js');

const { saveList } = require('../services/listService');
const saveBoardActivity = require('../services/saveBoardActivity');
const { checkBoardPermission } = require('../services/boardPermissionService.js');

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const addList = async (req, res) => {
    const { userId } = req.user;
    const { title, order, boardId } = req.body;

    await checkBoardPermission({
        boardId,
        userId,
        resource: "list",
        action: "create"
    })

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

    return res.status(201).json({ message: 'new list created', newList });
}

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const reorder = async (req, res) => {
    const { userId } = req.user;
    const { id } = req.params;
    const { rank, sourceIndex, destinationIndex } = req.body;

    const foundList = await List.findById(id);
    if (!foundList) return res.status(403).json({ message: "list not found" });

    await checkBoardPermission({
        boardId: foundList.boardId.toString(),
        userId,
        resource: "list",
        action: "edit"
    })

    if (foundList.order === rank) {
        return res.status(200).json({
            newList: foundList,
        });
    }

    foundList.order = rank;
    foundList.save();

    await saveBoardActivity({
        userId,
        boardId: foundList.boardId,
        listId: foundList._id,
        action: "update list rank",
        type: "list",
        description: `(${+sourceIndex + 1}) > (${+destinationIndex + 1})`,
    })

    res.status(200).json({ message: 'list updated', newList: foundList });
};

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const updateTitle = async (req, res) => {
    const { userId } = req.user;
    const { id } = req.params;
    const { title } = req.body;

    const foundList = await List.findById(id);
    if (!foundList) return res.status(403).json({ message: "list not found" });

    await checkBoardPermission({
        boardId: foundList.boardId.toString(),
        userId,
        resource: "list",
        action: "edit"
    })

    foundList.title = title;
    foundList.save();

    res.status(200).json({ message: 'list updated', newList: foundList });
};

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const deleteList = async (req, res) => {
    const { userId } = req.user;
    const { id } = req.params;

    const foundList = await List.findById(id);
    if (!foundList) return res.status(403).json({ message: "list not found" });

    await checkBoardPermission({
        boardId: foundList.boardId.toString(),
        userId,
        resource: "list",
        action: "delete"
    })

    await List.findByIdAndDelete(id);

    await saveBoardActivity({
        userId,
        boardId: foundList.boardId,
        action: "delete list",
        type: "list",
        description: `list with title "${foundList.title}" deleted`,
    });

    res.status(200).json({ message: 'list deleted' });
};

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const copyList = async (req, res) => {
    const { userId } = req.user;
    const { id } = req.params;
    const { rank } = req.body;

    const foundList = await List.findById(id);
    if (!foundList) {
        return res.status(403).json({ message: "List not found" });
    }

    const { title, boardId } = foundList;

    await checkBoardPermission({
        boardId: foundList.boardId.toString(),
        userId,
        resource: "list",
        action: "create"
    })

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

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const moveList = async (req, res) => {
    const { userId } = req.user;
    const { id, boardId, index } = req.params;

    const foundList = await List.findById(id);
    if (!foundList) {
        return res.status(403).json({ message: "List not found" });
    }

    // check for both sides, move on current board or move to another board
    // if move to different board, it's like remove from current and create from new

    const isMovedToDifferentBoard = foundList.boardId.toString() !== boardId;
    let boardToMove = null;
    if (isMovedToDifferentBoard) {
        const { board: _currentBoard } = await checkBoardPermission({
            boardId: foundList.boardId.toString(),
            userId,
            resource: "list",
            action: "delete"
        });

        const { board: newBoard } = await checkBoardPermission({
            boardId,
            userId,
            resource: "list",
            action: "create"
        })

        boardToMove = newBoard;
    } else {
        const { board } = await checkBoardPermission({
            boardId,
            userId,
            resource: "list",
            action: "edit"
        });

        boardToMove = board;
    }

    const sortedLists = await List.find({ boardId }).sort({ order: 'asc' });
    const [newOrder, ok] = lexorank.insert(sortedLists[+index - 1]?.order, sortedLists[+index]?.order);
    if (!ok) {
        return res.status(403).send("list's order is invalid");
    }

    foundList.order = newOrder;
    foundList.boardId = boardToMove._id;
    await foundList.save();

    await Card.updateMany({ listId: id }, { boardId: boardToMove._id });
    const newCards = await Card.find({ listId: id, boardId: boardToMove._id }).sort({ order: 'asc' });

    return res.status(200).json({ list: foundList, cards: newCards });
};

module.exports = {
    addList,
    updateTitle,
    deleteList,
    copyList,
    reorder,
    moveList,
};
