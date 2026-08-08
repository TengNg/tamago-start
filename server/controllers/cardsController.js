import mongoose from 'mongoose';
import Card from '../models/Card.js';
import List from '../models/List.js';
import Board from '../models/Board.js';
import User from '../models/User.js';
import BoardMembership from '../models/BoardMembership.js';
import Attachment from '../models/Attachment.js';
import CardComment from '../models/CardComment.js';

import { checkBoardPermission } from '../services/boardPermissionService.js';
import saveBoardActivity from '../services/saveBoardActivity.js';
import { generateCardOrder } from '../services/cardService.js';

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const getCard = async (req, res) => {
    const { userId } = req.user;
    const { id } = req.params;

    const foundCard = await Card.findById(id).lean();
    if (!foundCard) {
        return res.sendStatus(404);
    }

    await checkBoardPermission({
        boardId: foundCard.boardId.toString(),
        userId,
        resource: "card",
        action: "view"
    })

    return res.json(foundCard);
};

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const addCard = async (req, res) => {
    const { userId } = req.user;
    const { title, listId, prevCardId, nextCardId } = req.body;

    const foundList = await List.findById(listId).lean();
    if (!foundList) {
        return res.status(403).json({ message: "list not found" });
    }

    const { board } = await checkBoardPermission({
        boardId: foundList.boardId.toString(),
        userId,
        resource: "card",
        action: "create",
    });

    if (board.stats.cardCount >= board.limits.maxCards) {
        const msg = `Maximum card count reached for this board (maximum: ${board.limits.maxCards})`;
        return res.status(400).json({ message: msg });
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const order = await generateCardOrder({
            listId: foundList._id.toString(),
            prevCardId,
            nextCardId,
            session,
        });

        const [newCard] = await Card.create(
            [{ title, order, listId, boardId: board._id }],
            { session }
        );

        await Board.updateOne(
            { _id: board._id },
            { $inc: { "stats.cardCount": 1 } },
            { session }
        );

        await saveBoardActivity({
            userId,
            boardId: foundList.boardId,
            docId: newCard._id,
            action: "card.created",
            docModel: "Card",
            docTitle: newCard.title,
            description: `created in list "${foundList.title}"`,
            createdAt: newCard.updatedAt,
            session,
        })

        await session.commitTransaction();

        return res.status(201).json(newCard);
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
const reorder = async (req, res) => {
    const { userId } = req.user;
    const { id } = req.params;
    const { prevCardId, nextCardId, listId, oldPos, newPos } = req.body;

    const foundCard = await Card.findById(id).populate({
        path: 'listId',
        select: '_id title boardId'
    });
    if (!foundCard) {
        return res.sendStatus(404);
    }

    const populatedList = /** @type {any} */(foundCard.listId);
    const currentListId = populatedList._id;
    const currentCardListTitle = populatedList.title;

    const targetList = await List.findOne({ _id: listId, boardId: foundCard.boardId }).lean();
    if (!targetList) {
        return res.status(403).json({ message: "list not found" });
    }

    await checkBoardPermission({
        boardId: foundCard.boardId.toString(),
        userId,
        resource: "card",
        action: "edit"
    });

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const newOrder = await generateCardOrder({
            listId: targetList._id.toString(),
            prevCardId: prevCardId || null,
            nextCardId: nextCardId || null,
            session,
        });

        if (foundCard.order === newOrder && foundCard.listId === targetList._id) {
            await session.abortTransaction();
            return res.status(200).json({
                oldListId: currentListId,
                newCard: foundCard,
            });
        }

        foundCard.order = newOrder;
        foundCard.listId = targetList._id;
        await foundCard.save({ session });

        if (
            oldPos !== undefined
            && newPos !== undefined
            && !isNaN(+oldPos)
            && !isNaN(+newPos)
        ) {
            await saveBoardActivity({
                userId,
                boardId: targetList.boardId,
                docId: foundCard._id,
                action: "card.moved",
                docModel: "Card",
                docTitle: foundCard.title,
                description: `${currentCardListTitle} (${oldPos}) → ${targetList.title} (${newPos})`,
                session,
            });
        }

        await session.commitTransaction();

        res.json(foundCard);
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
const updateCard = async (req, res) => {
    const { userId } = req.user;
    const { id } = req.params;
    const { field, value } = req.body;

    const allowedFields = [
        "title", "description", "highlight", "priorityLevel",
        "owner", "dueDate", "verified",
    ];
    if (!allowedFields.includes(field)) {
        return res.status(400).json({ message: "Invalid field to update" });
    }

    const foundCard = await Card.findById(id);
    if (!foundCard) {
        return res.sendStatus(404);
    }

    await checkBoardPermission({
        boardId: foundCard.boardId.toString(),
        userId,
        resource: "card",
        action: "edit"
    });

    const prevValue = foundCard[field];

    if (field === "owner") {
        if (!value) {
            foundCard.owner = null;
        } else {
            const ownerUser = await User.findOne({ username: value }).lean();
            if (!ownerUser) {
                return res.status(400).json({ message: "user not found" });
            }

            const isMember = await BoardMembership.exists({
                boardId: foundCard.boardId,
                userId: ownerUser._id,
            });
            if (!isMember) {
                return res.status(400).json({ message: "user is not a member of this board" });
            }

            foundCard.owner = ownerUser._id;
        }
    } else {
        if (foundCard[field] === value) {
            return res.status(200).json(foundCard);
        }

        foundCard[field] = value;
    }

    const newCard = await foundCard.save();

    const actionMap = {
        title: "card.title_updated",
        description: "card.description_updated",
        highlight: "card.highlight_updated",
        priorityLevel: "card.priority_updated",
        owner: "card.owner_updated",
        dueDate: "card.due_date_updated",
        verified: foundCard.verified ? "card.verified" : "card.unverified",
    };

    let description;
    if (field === "owner") {
        const prevOwnerName = prevValue
            ? (await User.findById(prevValue).select("username").lean())?.username || "unknown"
            : "none";
        const newOwnerName = newCard.owner
            ? (await User.findById(newCard.owner).select("username").lean())?.username || "unknown"
            : "none";
        description = `${prevOwnerName} → ${newOwnerName}`;
    } else if (field === "verified") {
        description = null;
    } else if (field === "dueDate") {
        description = `${prevValue || "none"} → ${value || "none"}`;
    } else {
        description = `"${prevValue}" → "${value}"`;
    }

    await saveBoardActivity({
        userId,
        boardId: foundCard.boardId,
        docId: foundCard._id,
        action: actionMap[field] || "card.updated",
        docModel: "Card",
        docTitle: foundCard.title,
        description,
    });

    res.status(200).json(newCard);
};

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const deleteCard = async (req, res) => {
    const { userId } = req.user;
    const { id } = req.params;

    const foundCard = await Card.findById(id).lean();
    if (!foundCard) {
        return res.sendStatus(404);
    }

    const { board } = await checkBoardPermission({
        boardId: foundCard.boardId.toString(),
        userId,
        resource: "card",
        action: "delete"
    });

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        await Attachment.deleteMany({ docModel: 'Card', doc: foundCard._id }).session(session);
        await CardComment.deleteMany({ cardId: foundCard._id }).session(session);
        await Card.findOneAndDelete({ _id: id }).session(session);

        await Board.updateOne(
            { _id: board._id },
            { $inc: { "stats.cardCount": -1 } },
            { session }
        );

        await saveBoardActivity({
            userId,
            boardId: foundCard.boardId,
            docId: foundCard._id,
            action: "card.deleted",
            docModel: "Card",
            docTitle: foundCard.title,
            description: `card with title "${foundCard.title}" deleted`,
            session,
        });

        await session.commitTransaction();

        res.sendStatus(204);
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
const copyCard = async (req, res) => {
    const { userId } = req.user;
    const { id } = req.params;
    const { prevCardId, nextCardId } = req.body;

    const foundCard = await Card.findById(id).lean();
    if (!foundCard) {
        return res.sendStatus(404);
    }

    const foundList = await List.findById(foundCard.listId).lean();
    if (!foundList) {
        return res.status(403).json({ message: "list not found" });
    }

    const { board } = await checkBoardPermission({
        boardId: foundCard.boardId.toString(),
        userId,
        resource: "card",
        action: "create"
    });

    if (board.stats.cardCount >= board.limits.maxCards) {
        const msg = `Maximum card count reached for this board (maximum: ${board.limits.maxCards})`;
        return res.status(400).json({ message: msg });
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const order = await generateCardOrder({
            listId: foundCard.listId.toString(),
            prevCardId: prevCardId || null,
            nextCardId: nextCardId || null,
            session,
        });

        const [newCard] = await Card.create(
            [{
                ...foundCard,
                _id: new mongoose.Types.ObjectId(),
                order,
            }],
            { session }
        );

        await Board.updateOne(
            { _id: board._id },
            { $inc: { "stats.cardCount": 1 } },
            { session }
        );

        await saveBoardActivity({
            boardId: newCard.boardId,
            userId,
            docId: newCard._id,
            action: "card.copied",
            docModel: "Card",
            docTitle: foundCard.title,
            description: `a copy of "${foundCard.title}" created`,
            session,
        });

        await session.commitTransaction();
        return res.json(newCard);
    } catch (err) {
        await session.abortTransaction();
        throw err;
    } finally {
        session.endSession();
    }
};

export {
    getCard,
    addCard,
    deleteCard,
    reorder,
    copyCard,
    updateCard,
}
