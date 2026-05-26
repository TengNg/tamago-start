import mongoose from 'mongoose';
import Card from '../models/Card.js';

import { checkBoardPermission } from '../services/boardPermissionService.js';
import saveBoardActivity from '../services/saveBoardActivity.js';

import { listById } from '../services/listService.js';
import { cardById } from '../services/cardService.js';

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const getCard = async (req, res) => {
    const { userId } = req.user;
    const { id } = req.params;

    const foundCard = await cardById(id);
    if (!foundCard) {
        return res.sendStatus(404);
    }

    await checkBoardPermission({
        boardId: foundCard.boardId.toString(),
        userId,
        resource: "card",
        action: "view"
    })

    return res.status(200).json({ card: foundCard });
};

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const addCard = async (req, res) => {
    const { userId } = req.user;
    const { trackedId, title, order, listId } = req.body;

    const foundList = await listById(listId);
    if (!foundList) return res.status(403).json({ message: "list not found" });

    await checkBoardPermission({
        boardId: foundList.boardId.toString(),
        userId,
        resource: "card",
        action: "create"
    });

    const newCard = new Card({
        trackedId,
        title,
        order,
        listId,
        boardId: foundList.boardId,
    });

    await newCard.save();

    await saveBoardActivity({
        userId,
        boardId: foundList.boardId,
        cardId: newCard._id,
        listId: foundList._id,
        action: "add new card",
        type: "card",
        description: `created in list "${foundList.title}"`,
        createdAt: newCard.updatedAt,
    })

    return res.status(201).json({ newCard });
};

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const reorder = async (req, res) => {
    const { userId } = req.user;
    const { id } = req.params;
    const { rank, listId, timestamp, oldPos, newPos } = req.body;

    const foundCard = await Card.findById(id).populate({
        path: 'listId',
        select: '_id title boardId'
    });
    if (!foundCard) {
        return res.sendStatus(404);
    }

    await checkBoardPermission({
        boardId: foundCard.boardId.toString(),
        userId,
        resource: "card",
        action: "edit"
    });

    const populatedList = /** @type {any} */(foundCard.listId);
    const currentListId = populatedList._id;
    const currentCardListTitle = populatedList.title;

    const foundList = await listById(listId);
    if (!foundList) {
        return res.status(403).json({ message: "list not found" });
    }

    if (foundCard.order === rank) {
        return res.status(200).json({
            oldListId: currentListId,
            newCard: foundCard,
        });
    }

    foundCard.order = rank;
    foundCard.listId = listId;
    foundCard.updatedAt = timestamp;
    await foundCard.save();

    await saveBoardActivity({
        userId,
        boardId: foundList.boardId,
        cardId: foundCard._id,
        listId: foundList._id,
        action: "update card position",
        type: "card",
        description: `${currentCardListTitle} (${oldPos}) > ${foundList.title} (${newPos})`,
        createdAt: foundCard.updatedAt,
    });

    res.status(200).json({
        oldListId: currentListId,
        newCard: foundCard,
    });
};

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const updateTitle = async (req, res) => {
    const { userId } = req.user;
    const { id } = req.params;
    const { title } = req.body;

    const foundCard = await cardById(id, { lean: false });
    if (!foundCard) return res.sendStatus(404);

    await checkBoardPermission({
        boardId: foundCard.boardId.toString(),
        userId,
        resource: "card",
        action: "edit"
    });

    foundCard.title = title.trim();
    await foundCard.save();

    res.status(200).json({ message: 'card updated', newCard: foundCard });
};

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const updateDescription = async (req, res) => {
    const { userId } = req.user;
    const { id } = req.params;
    const { description } = req.body;

    const foundCard = await cardById(id, { lean: false });
    if (!foundCard) return res.sendStatus(404);

    await checkBoardPermission({
        boardId: foundCard.boardId.toString(),
        userId,
        resource: "card",
        action: "edit"
    });

    foundCard.description = description;
    await foundCard.save();

    res.status(200).json({ newCard: foundCard });
};

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const updateHighlight = async (req, res) => {
    const { userId } = req.user;
    const { id } = req.params;
    const { highlight } = req.body;

    const foundCard = await cardById(id, { lean: false });
    if (!foundCard) return res.sendStatus(404);

    await checkBoardPermission({
        boardId: foundCard.boardId.toString(),
        userId,
        resource: "card",
        action: "edit"
    });

    foundCard.highlight = highlight;
    await foundCard.save();

    res.status(200).json({ newCard: foundCard });
};

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const updatePriorityLevel = async (req, res) => {
    const { userId } = req.user;
    const { id } = req.params;
    const { priorityLevel } = req.body;

    const foundCard = await cardById(id, { lean: false });
    if (!foundCard) return res.sendStatus(404);

    const currentPriorityLevel = foundCard.priorityLevel;

    await checkBoardPermission({
        boardId: foundCard.boardId.toString(),
        userId,
        resource: "card",
        action: "edit"
    });

    foundCard.priorityLevel = priorityLevel;
    await foundCard.save();

    await saveBoardActivity({
        userId,
        boardId: foundCard.boardId,
        cardId: foundCard._id,
        action: "update card priority level",
        type: "card",
        description: `${currentPriorityLevel} > ${priorityLevel}`,
        createdAt: foundCard.updatedAt,
    })

    res.status(200).json({ newCard: foundCard });
};

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const deleteCard = async (req, res) => {
    const { userId } = req.user;
    const { id } = req.params;

    const foundCard = await cardById(id, { lean: true });
    if (!foundCard) return res.sendStatus(404);

    await checkBoardPermission({
        boardId: foundCard.boardId.toString(),
        userId,
        resource: "card",
        action: "delete"
    });

    await Card.findOneAndDelete({ _id: id });

    await saveBoardActivity({
        userId,
        boardId: foundCard.boardId,
        action: "delete card",
        type: "card",
        description: `card with title "${foundCard.title}" deleted`,
    });

    res.status(200).json({ message: 'Card removed successfully' });
};

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const copyCard = async (req, res) => {
    const { userId } = req.user;
    const { id } = req.params;
    const { rank } = req.body;

    const foundCard = await cardById(id, { lean: true });
    if (!foundCard) return res.sendStatus(404);

    await checkBoardPermission({
        boardId: foundCard.boardId.toString(),
        userId,
        resource: "card",
        action: "create"
    });

    const newCard = new Card({
        ...foundCard,
        _id: new mongoose.Types.ObjectId(),
        order: rank,
    });

    await newCard.save();

    await saveBoardActivity({
        boardId: foundCard.boardId,
        userId,
        cardId: foundCard._id,
        action: "copy card",
        type: "card",
        description: `[important] create a copy of card with title "${foundCard.title}"`,
    })

    return res.status(200).json({ newCard });
};

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const updateOwner = async (req, res) => {
    const { userId } = req.user;
    const { id } = req.params;
    const { ownerName } = req.body;

    const foundCard = await cardById(id, { lean: false });
    if (!foundCard) return res.sendStatus(404);

    await checkBoardPermission({
        boardId: foundCard.boardId.toString(),
        userId,
        resource: "card",
        action: "edit"
    });

    foundCard.owner = ownerName;
    await foundCard.save();

    res.status(200).json({ newCard: foundCard });
};

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const toggleVerified = async (req, res) => {
    const { userId } = req.user;
    const { id } = req.params;

    const foundCard = await cardById(id, { lean: false });
    if (!foundCard) return res.sendStatus(404);

    await checkBoardPermission({
        boardId: foundCard.boardId.toString(),
        userId,
        resource: "card",
        action: "edit"
    });

    foundCard.verified = !foundCard.verified;
    await foundCard.save();

    const action = foundCard.verified ? 'verify card' : 'unverified card';

    await saveBoardActivity({
        boardId: foundCard.boardId,
        userId,
        cardId: foundCard._id,
        action: action,
        type: "card",
        createdAt: foundCard.updatedAt,
    })

    res.status(200).json({ verified: foundCard.verified });
};

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const updateDueDate = async (req, res) => {
    const { userId } = req.user;
    const { id } = req.params;

    const foundCard = await cardById(id, { lean: false });
    if (!foundCard) return res.sendStatus(404);

    await checkBoardPermission({
        boardId: foundCard.boardId.toString(),
        userId,
        resource: "card",
        action: "edit"
    });

    foundCard.dueDate = req.body.dueDate;
    await foundCard.save();

    res.status(200).json({ dueDate: foundCard.dueDate });
};

export {
    getCard,
    addCard,
    updateTitle,
    updateDescription,
    updateHighlight,
    updatePriorityLevel,
    deleteCard,
    reorder,
    copyCard,
    updateOwner,
    toggleVerified,
    updateDueDate,
}
