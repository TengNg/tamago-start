import mongoose from 'mongoose';
import List from '../models/List.js';
import Card from '../models/Card.js';
import CardComment from '../models/CardComment.js';
import Attachment from '../models/Attachment.js';
import Board from '../models/Board.js';

import saveBoardActivity from '../services/saveBoardActivity.js';
import { checkBoardPermission } from '../services/boardPermissionService.js';
import { generateListOrder } from '../services/listService.js';
import { cloneList } from '../services/cloneService.js';
import { UPDATE_FIELDS } from '../constants/updateFields.js';
import { SOCKET_EVENTS } from '../../shared/socket-events.js';
import { emitToBoard } from '../socket/registry.js';

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const addList = async (req, res) => {
    const { userId } = req.user;
    const { title, boardId, prevListId, nextListId } = req.body;

    const { board } = await checkBoardPermission({
        boardId,
        userId,
        resource: "list",
        action: "create"
    })

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const boardAfterList = await Board.findOneAndUpdate(
            {
                _id: board._id,
                $expr: { $lt: ["$stats.listCount", "$limits.maxLists"] },
            },
            { $inc: { "stats.listCount": 1 } },
            { session, new: true },
        );
        if (!boardAfterList) {
            await session.abortTransaction();
            const msg = `Maximum list count reached for this board (maximum: ${board.limits.maxLists})`;
            return res.status(400).json({ message: msg });
        }

        const order = await generateListOrder({
            boardId,
            prevListId,
            nextListId,
            session,
        });

        const [newList] = await List.create(
            [{ title, order, boardId }],
            { session }
        );

        await saveBoardActivity({
            boardId,
            userId,
            docId: newList._id,
            action: "list.created",
            docModel: "List",
            docTitle: newList.title,
            description: '',
            session,
        })

        await session.commitTransaction();

        emitToBoard(board._id, SOCKET_EVENTS.LIST_CREATED, newList.toJSON());

        return res.status(201).json(newList);
    } catch (err) {
        await session.abortTransaction();
        throw err;
    } finally {
        session.endSession();
    }
}

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const reorder = async (req, res) => {
    const { userId } = req.user;
    const { id } = req.params;
    const { prevListId, nextListId, oldPos, newPos } = req.body;

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

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const newOrder = await generateListOrder({
            boardId: foundList.boardId.toString(),
            prevListId: prevListId || null,
            nextListId: nextListId || null,
            session,
        });

        if (foundList.order === newOrder) {
            await session.abortTransaction();
            return res.json(foundList);
        }

        foundList.order = newOrder;
        await foundList.save({ session });

        if (
            oldPos !== undefined
            && newPos !== undefined
            && !isNaN(+oldPos)
            && !isNaN(+newPos)
        ) {
            await saveBoardActivity({
                userId,
                boardId: foundList.boardId,
                docId: foundList._id,
                action: "list.reordered",
                docModel: "List",
                docTitle: foundList.title,
                description: `(${+oldPos + 1}) → (${+newPos + 1})`,
                session,
            });
        }

        await session.commitTransaction();

        emitToBoard(foundList.boardId, SOCKET_EVENTS.LIST_MOVED, {
            id: foundList._id.toString(),
            order: foundList.order,
        });

        res.json(foundList);
    } catch (err) {
        await session.abortTransaction();
        throw err;
    } finally {
        session.endSession();
    }
};

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const updateList = async (req, res) => {
    const { userId } = req.user;
    const { id } = req.params;
    const { field, value } = req.body;

    const allowedFields = UPDATE_FIELDS.list;
    if (!allowedFields.includes(field)) {
        return res.status(400).json({ message: "Invalid field to update" });
    }

    const foundList = await List.findById(id);
    if (!foundList) {
        return res.sendStatus(404);
    }

    await checkBoardPermission({
        boardId: foundList.boardId.toString(),
        userId,
        resource: "list",
        action: "edit"
    });

    if (foundList[field] === value) {
        return res.status(200).json(foundList);
    }

    const prevValue = foundList[field];
    foundList[field] = value;
    await foundList.save();

    const actionMap = {
        title: "list.title_updated",
    };
    const description = `"${prevValue}" → "${value}"`.trim();

    await saveBoardActivity({
        userId,
        boardId: foundList.boardId,
        docId: foundList._id,
        action: actionMap[field] || "list.updated",
        docModel: "List",
        docTitle: foundList.title,
        description,
    });

    emitToBoard(foundList.boardId, SOCKET_EVENTS.LIST_UPDATED, {
        id: foundList._id.toString(),
        field,
        value: foundList[field],
    });

    res.status(200).json(foundList);
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

        const { board } = await checkBoardPermission({
            boardId: foundList.boardId.toString(),
            userId,
            resource: "list",
            action: "delete"
        })

        const cardIds = await Card.find({ listId: foundList._id }).distinct('_id');
        if (cardIds.length > 0) {
            await Attachment.deleteMany({ docModel: 'Card', doc: { $in: cardIds } }).session(session);
            await CardComment.deleteMany({ cardId: { $in: cardIds } }).session(session);
            await Card.deleteMany({ _id: { $in: cardIds } }).session(session);
        }

        await List.findByIdAndDelete(id).session(session);

        await Board.updateOne(
            { _id: board._id },
            {
                $inc: {
                    "stats.listCount": -1,
                    "stats.cardCount": -cardIds.length,
                },
            },
            { session }
        );

        await saveBoardActivity({
            userId,
            boardId: foundList.boardId,
            docId: foundList._id,
            action: "list.deleted",
            docModel: "List",
            docTitle: foundList.title,
            description: `list with title "${foundList.title}" deleted`,
            session,
        });

        await session.commitTransaction();

        emitToBoard(foundList.boardId, SOCKET_EVENTS.LIST_DELETED, {
            id: foundList._id.toString(),
        });

        res.sendStatus(204);
    } catch (error) {
        await session.abortTransaction();
        throw error;
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
    const { prevListId, nextListId } = req.body;

    const foundList = await List.findById(id);
    if (!foundList) {
        return res.sendStatus(404);
    }

    const boardId = foundList.boardId;

    await checkBoardPermission({
        boardId: boardId.toString(),
        userId,
        resource: "list",
        action: "create"
    })

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { list, cards } = await cloneList({
            list: foundList,
            prevListId,
            nextListId,
            userId,
            session,
        });

        await session.commitTransaction();

        emitToBoard(boardId, SOCKET_EVENTS.LIST_COPIED, {
            list: list.toJSON(),
            cards: cards.map((card) => card.toJSON()),
        });

        res.status(201).json({ list, cards });
    } catch (err) {
        await session.abortTransaction();
        throw err;
    } finally {
        session.endSession();
    }
};

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const moveList = async (req, res) => {
    const { userId } = req.user;
    const { id, boardId, index } = req.params;

    if (isNaN(+index)) {
        return res.status(422).json({ message: "Index must be a number" });
    }

    const foundList = await List.findById(id);
    if (!foundList) {
        return res.sendStatus(404);
    }

    const initialBoardId = foundList.boardId.toString();
    const isMovedToDifferentBoard = initialBoardId !== boardId;

    let targetBoard = null;
    let prevListId = null;
    let nextListId = null;

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
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

            if (newBoard.stats.listCount >= newBoard.limits.maxLists) {
                const msg = `Maximum list count reached for board "${newBoard.title}" (maximum: ${newBoard.limits.maxLists})`;
                return res.status(400).json({ message: msg });
            }

            const movedCardCount = await Card.countDocuments({ boardId: initialBoardId, listId: foundList._id });
            if (newBoard.stats.cardCount + movedCardCount > newBoard.limits.maxCards) {
                const msg = `Maximum card count reached for board "${newBoard.title}" (maximum: ${newBoard.limits.maxCards})`;
                return res.status(400).json({ message: msg });
            }

            await Board.updateOne(
                { _id: initialBoardId },
                { $inc: { "stats.listCount": -1, "stats.cardCount": -movedCardCount } },
                { session }
            );

            const targetAfter = await Board.findOneAndUpdate(
                {
                    _id: newBoard._id,
                    $expr: {
                        $and: [
                            { $lte: [{ $add: ["$stats.listCount", 1] }, "$limits.maxLists"] },
                            { $lte: [{ $add: ["$stats.cardCount", movedCardCount] }, "$limits.maxCards"] },
                        ],
                    },
                },
                { $inc: { "stats.listCount": 1, "stats.cardCount": movedCardCount } },
                { session, new: true },
            );
            if (!targetAfter) {
                await session.abortTransaction();
                const msg = `Maximum card count reached for board "${newBoard.title}" (maximum: ${newBoard.limits.maxCards})`;
                return res.status(400).json({ message: msg });
            }

            targetBoard = newBoard;

            const sortedLists = await List.find({ boardId }).sort({ order: 'asc' });
            const insertionIdx = Math.min(Math.max(+index, 0), sortedLists.length);
            prevListId = insertionIdx > 0 ? sortedLists[insertionIdx - 1]?._id.toString() : null;
            nextListId = insertionIdx < sortedLists.length ? sortedLists[insertionIdx]?._id.toString() : null;
        } else {
            const { board } = await checkBoardPermission({
                boardId,
                userId,
                resource: "list",
                action: "edit"
            });

            targetBoard = board;

            const sortedLists = await List.find({ boardId }).sort({ order: 'asc' });
            const movedListIdx = sortedLists.findIndex(l => l._id.toString() === foundList._id.toString());

            const rest = sortedLists.filter((_, i) => i !== movedListIdx);
            const insertionIdx = Math.min(Math.max(+index, 0), rest.length);
            prevListId = insertionIdx > 0 ? rest[insertionIdx - 1]?._id.toString() : null;
            nextListId = insertionIdx < rest.length ? rest[insertionIdx]?._id.toString() : null;
        }

        const newOrder = await generateListOrder({
            boardId: targetBoard._id.toString(),
            prevListId,
            nextListId,
            session,
        });

        foundList.order = newOrder;
        foundList.boardId = targetBoard._id;
        await foundList.save({ session });

        await Card.updateMany({ listId: id }, { boardId: targetBoard._id }).session(session);
        const newCards = await Card.find({ listId: id, boardId: targetBoard._id }).sort({ order: 'asc' }).session(session);

        await saveBoardActivity({
            boardId: targetBoard._id,
            userId,
            docId: foundList._id,
            action: "list.moved",
            docModel: "List",
            docTitle: foundList.title,
            description: isMovedToDifferentBoard
                ? `moved to board "${targetBoard.title}"`
                : `reordered to position ${+index + 1}`,
            session,
        });

        await session.commitTransaction();

        emitToBoard(initialBoardId, SOCKET_EVENTS.LIST_DELETED, {
            id: foundList._id.toString(),
        });
        emitToBoard(targetBoard._id, SOCKET_EVENTS.LIST_MOVED_TO_BOARD, {
            list: foundList.toJSON(),
            cards: newCards.map((card) => card.toJSON()),
            index: +index,
        });

        return res.status(200).json({ list: foundList, cards: newCards });
    } catch (err) {
        await session.abortTransaction();
        throw err;
    } finally {
        session.endSession();
    }
};

export {
    addList,
    updateList,
    deleteList,
    copyList,
    reorder,
    moveList,
};
