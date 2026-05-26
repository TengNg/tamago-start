import mongoose from 'mongoose';
import List from '../models/List.js';
import Card from '../models/Card.js';
import Board from '../models/Board.js';
import { lexorank } from '../lib/lexorank.js';

import { saveList } from '../services/listService.js';
import saveBoardActivity from '../services/saveBoardActivity.js';
import { checkBoardPermission } from '../services/boardPermissionService.js';

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

    await Board.updateOne({ _id: boardId }, { $inc: { listCount: 1 } });

    await saveBoardActivity({
        boardId,
        userId,
        listId: newList._id,
        action: "add new list",
        type: "list",
        description: '',
    })

    return res.status(201).json({ newList });
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
    if (!foundList) return res.sendStatus(404);

    await checkBoardPermission({
        boardId: foundList.boardId.toString(),
        userId,
        resource: "list",
        action: "edit"
    })

    if (foundList.order === rank) {
        return res.status(200).json({ newList: foundList });
    }

    foundList.order = rank;
    await foundList.save();

    if (
        sourceIndex
        && destinationIndex
        && !isNaN(+sourceIndex)
        && !isNaN(+destinationIndex)
    ) {
        await saveBoardActivity({
            userId,
            boardId: foundList.boardId,
            listId: foundList._id,
            action: "update list rank",
            type: "list",
            description: `(${+sourceIndex + 1}) > (${+destinationIndex + 1})`,
        });
    }

    res.status(200).json({ newList: foundList });
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
    if (!foundList) return res.sendStatus(404);

    await checkBoardPermission({
        boardId: foundList.boardId.toString(),
        userId,
        resource: "list",
        action: "edit"
    })

    foundList.title = title;
    await foundList.save();

    res.status(200).json({ newList: foundList });
};

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const deleteList = async (req, res) => {
    const { userId } = req.user;
    const { id } = req.params;

    const foundList = await List.findById(id);
    if (!foundList) return res.sendStatus(404);

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

    res.sendStatus(204);
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
        return res.sendStatus(404);
    }

    const { title, boardId } = foundList;

    await checkBoardPermission({
        boardId: foundList.boardId.toString(),
        userId,
        resource: "list",
        action: "create"
    })

    const listData = {
        _id: new mongoose.Types.ObjectId(),
        title,
        order: rank,
        boardId,
    };

    const list = await saveList(listData);

    const copiedCards = await Card.find({ listId: id }).lean();
    const newCards = [];

    for (const card of copiedCards) {
        const newCard = new Card({
            ...card,
            _id: new mongoose.Types.ObjectId(),
            trackedId: crypto.randomUUID(),
            listId: list._id,
            boardId: list.boardId
        });

        await newCard.save();
        newCards.push(newCard);
    }

    await Board.updateOne({ _id: boardId }, { $inc: { listCount: 1 } });

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

    if (isNaN(+index)) {
        return res.sendStatus(422).json({ message: "index must be a number" });
    }

    const foundList = await List.findById(id);
    if (!foundList) {
        return res.sendStatus(404);
    }

    // check for both sides, move on current board or move to another board
    // if move to different board, it's like remove from current and create from new

    const initialBoardId = foundList.boardId.toString();
    const isMovedToDifferentBoard = initialBoardId !== boardId;
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
    const indexToMove = +index < 0
        ? 0
        : +index > sortedLists.length + 1
            ? sortedLists.length
            : +index
    const movedListIndex = sortedLists.findIndex(l => {
        return l._id.toString() === foundList._id.toString();
    });
    const srcOrder =
        movedListIndex < +index && foundList.boardId.toString() === boardId
            ? sortedLists[+indexToMove]?.order
            : sortedLists[+indexToMove - 1]?.order
    const dstOrder =
        movedListIndex < +index && foundList.boardId.toString() === boardId
            ? sortedLists[+indexToMove + 1]?.order
            : sortedLists[+indexToMove]?.order
    const [newOrder, ok] = lexorank.insert(srcOrder, dstOrder);
    if (!ok) {
        return res.status(403).send("list's order is invalid");
    }

    foundList.order = newOrder;
    foundList.boardId = boardToMove._id;
    await foundList.save();

    await Card.updateMany({ listId: id }, { boardId: boardToMove._id });
    const newCards = await Card.find({ listId: id, boardId: boardToMove._id }).sort({ order: 'asc' });

    if (isMovedToDifferentBoard) {
        await Board.updateOne({ _id: initialBoardId }, { $inc: { listCount: -1 } });
        await Board.updateOne({ _id: boardToMove._id }, { $inc: { listCount: 1 } });
    }

    return res.status(200).json({ list: foundList, cards: newCards });
};

export {
    addList,
    updateTitle,
    deleteList,
    copyList,
    reorder,
    moveList,
};
