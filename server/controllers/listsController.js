import mongoose from 'mongoose';
import List from '../models/List.js';
import Card from '../models/Card.js';
import CardComment from '../models/CardComment.js';
import Attachment from '../models/Attachment.js';
import { lexorank } from '../lib/lexorank.js';

import saveBoardActivity from '../services/saveBoardActivity.js';
import { checkBoardPermission } from '../services/boardPermissionService.js';
import { MAX_CARD_COUNT, MAX_LIST_COUNT } from '../constants/limits.js';

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
        docId: newList._id,
        action: "list.created",
        docModel: "List",
        docTitle: newList.title,
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
        sourceIndex !== undefined
        && destinationIndex !== undefined
        && !isNaN(+sourceIndex)
        && !isNaN(+destinationIndex)
    ) {
        await saveBoardActivity({
            userId,
            boardId: foundList.boardId,
            docId: foundList._id,
            action: "list.reordered",
            docModel: "List",
            docTitle: foundList.title,
            description: `(${+sourceIndex + 1}) → (${+destinationIndex + 1})`,
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
    if (!foundList) {
        return res.sendStatus(404);
    }

    await checkBoardPermission({
        boardId: foundList.boardId.toString(),
        userId,
        resource: "list",
        action: "edit"
    })

    const prevTitle = foundList.title;
    foundList.title = title;
    await foundList.save();

    await saveBoardActivity({
        userId,
        boardId: foundList.boardId,
        docId: foundList._id,
        action: "list.title_updated",
        docModel: "List",
        docTitle: foundList.title,
        description: `"${prevTitle}" → "${foundList.title}"`,
    });

    res.status(200).json({ newList: foundList });
};

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const deleteList = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { userId } = req.user;
        const { id } = req.params;

        const foundList = await List.findById(id);
        if (!foundList) {
            return res.sendStatus(404);
        }

        await checkBoardPermission({
            boardId: foundList.boardId.toString(),
            userId,
            resource: "list",
            action: "delete"
        })

        const cardIds = await Card.find({ listId: foundList._id }).distinct('_id');
        if (cardIds.length > 0) {
            await Attachment.deleteMany({ docModel: 'Card', doc: { $in: cardIds } });
            await CardComment.deleteMany({ cardId: { $in: cardIds } });
            await Card.deleteMany({ _id: { $in: cardIds } });
        }

        await List.findByIdAndDelete(id);

        await saveBoardActivity({
            userId,
            boardId: foundList.boardId,
            docId: foundList._id,
            action: "list.deleted",
            docModel: "List",
            docTitle: foundList.title,
            description: `list with title "${foundList.title}" deleted`,
        });

        res.sendStatus(204);
    } catch (error) {
        await session.abortTransaction();
        const status = error.status || 500;
        res.status(status).json({ message: error.message });
    } finally {
        session.endSession();
    }
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

    const list = new List(listData);
    await list.save();

    const cards = await Card.find({ boardId, listId: id }).lean();

    const cardDocs = cards.map(card => ({
        ...card,
        _id: new mongoose.Types.ObjectId(),
        listId: list._id,
        boardId: list.boardId,
    }));

    const copiedCards = cardDocs.length > 0 ? await Card.insertMany(cardDocs) : [];

    await saveBoardActivity({
        boardId,
        userId,
        docId: foundList._id,
        action: "list.copied",
        docModel: "List",
        docTitle: foundList.title,
        description: `a copy of "${foundList.title}" created`,
    })

    res.status(200).json({ list, cards: copiedCards, message: 'list copied' });
};

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const moveList = async (req, res) => {
    const { userId } = req.user;
    const { id, boardId, index } = req.params;

    if (isNaN(+index)) {
        return res.status(422).json({ message: "index must be a number" });
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

        const [listCount, existingCardCount] = await Promise.all([
            List.countDocuments({ boardId: newBoard._id }),
            Card.countDocuments({ boardId: newBoard._id }),
        ]);
        if (listCount >= MAX_LIST_COUNT) {
            const errMsg = `Maximum list count reached for board ${newBoard.title} (maximum: ${MAX_LIST_COUNT})`;
            return res.status(429).json({ message: errMsg })
        }
        const movedCardCount = await Card.countDocuments({ boardId: newBoard._id, listId: foundList._id });
        if (existingCardCount + movedCardCount > MAX_CARD_COUNT) {
            const errMsg = `Maximum card count reached for board ${newBoard.title} (maximum: ${MAX_CARD_COUNT})`;
            return res.status(429).json({ message: errMsg })
        }

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
