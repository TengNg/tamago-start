import mongoose from 'mongoose';
import Card from '../models/Card.js';
import List from '../models/List.js';

import { checkBoardPermission } from '../services/boardPermissionService.js';
import saveBoardActivity from '../services/saveBoardActivity.js';
import dateFormatter from '../utils/dateFormatter.js';

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

    return res.status(200).json({ card: foundCard });
};

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const addCard = async (req, res) => {
    const { userId } = req.user;
    const { title, order, listId } = req.body;

    const foundList = await List.findById(listId).lean();
    if (!foundList) {
        return res.status(403).json({ message: "list not found" });
    }

    await checkBoardPermission({
        boardId: foundList.boardId.toString(),
        userId,
        resource: "card",
        action: "create"
    });

    const newCard = new Card({
        title,
        order,
        listId,
        boardId: foundList.boardId,
    });

    await newCard.save();

    await saveBoardActivity({
        userId,
        boardId: foundList.boardId,
        docId: newCard._id,
        action: "card.created",
        docModel: "Card",
        docTitle: newCard.title,
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

    const foundList = await List.findById(listId).lean();
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
        docId: foundCard._id,
        action: "card.moved",
        docModel: "Card",
        docTitle: foundCard.title,
        description: `${currentCardListTitle} (${oldPos}) →  ${foundList.title} (${newPos})`,
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

    const prevTitle = foundCard.title;
    foundCard.title = title.trim();
    await foundCard.save();

    await saveBoardActivity({
        userId,
        boardId: foundCard.boardId,
        docId: foundCard._id,
        docModel: "Card",
        docTitle: foundCard.title,
        action: "card.title_updated",
        description: `"${prevTitle}" → "${foundCard.title}"`,
    });

    res.status(200).json({ newCard: foundCard });
};

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const updateDescription = async (req, res) => {
    const { userId } = req.user;
    const { id } = req.params;
    const { description } = req.body;

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

    const prevDescription = foundCard.description;
    foundCard.description = description;
    await foundCard.save();

    await saveBoardActivity({
        userId,
        boardId: foundCard.boardId,
        docId: foundCard._id,
        action: "card.description_updated",
        docModel: "Card",
        docTitle: foundCard.title,
        description: `"${prevDescription}" → "${foundCard.description}"`,
    });

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

    const prevHighlight = foundCard.highlight;
    foundCard.highlight = highlight;
    await foundCard.save();

    await saveBoardActivity({
        userId,
        boardId: foundCard.boardId,
        docId: foundCard._id,
        action: "card.highlight_updated",
        docModel: "Card",
        docTitle: foundCard.title,
        description: `${prevHighlight} → ${foundCard.highlight}`,
    });

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

    const prevPriority = foundCard.priorityLevel;
    foundCard.priorityLevel = priorityLevel;
    await foundCard.save();

    await saveBoardActivity({
        userId,
        boardId: foundCard.boardId,
        docId: foundCard._id,
        action: "card.priority_updated",
        docModel: "Card",
        docTitle: foundCard.title,
        description: `${prevPriority} → ${foundCard.priorityLevel}`,
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

    const foundCard = await Card.findById(id).lean();
    if (!foundCard) {
        return res.sendStatus(404);
    }

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
        docId: foundCard._id,
        action: "card.deleted",
        docModel: "Card",
        docTitle: foundCard.title,
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

    const foundCard = await Card.findById(id).lean();
    if (!foundCard) {
        return res.sendStatus(404);
    }

    await checkBoardPermission({
        boardId: foundCard.boardId.toString(),
        userId,
        resource: "card",
        action: "create"
    });

    const newCard = new Card({
        ...foundCard,
        _id: new mongoose.Types.ObjectId(),
        createdAt: new Date(),
        updatedAt: new Date(),
        order: rank,
    });

    await newCard.save();

    await saveBoardActivity({
        boardId: newCard.boardId,
        userId,
        docId: newCard._id,
        action: "card.copied",
        docModel: "Card",
        docTitle: foundCard.title,
        description: `a copy of "${foundCard.title}" created`,
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

    const foundCard = await Card.findById(id);
    if (!foundCard) return res.sendStatus(404);

    await checkBoardPermission({
        boardId: foundCard.boardId.toString(),
        userId,
        resource: "card",
        action: "edit"
    });

    const prevOwner = foundCard.owner;
    foundCard.owner = ownerName;
    const newCard = await foundCard.save();

    await saveBoardActivity({
        boardId: newCard.boardId,
        userId,
        docId: newCard._id,
        action: "card.owner_updated",
        docModel: "Card",
        docTitle: foundCard.title,
        description: `${prevOwner} →  ${foundCard.owner}`,
    })

    res.status(200).json({ newCard: foundCard });
};

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const toggleVerified = async (req, res) => {
    const { userId } = req.user;
    const { id } = req.params;

    const foundCard = await Card.findById(id);
    if (!foundCard) return res.sendStatus(404);

    await checkBoardPermission({
        boardId: foundCard.boardId.toString(),
        userId,
        resource: "card",
        action: "edit"
    });

    foundCard.verified = !foundCard.verified;
    await foundCard.save();

    await saveBoardActivity({
        boardId: foundCard.boardId,
        userId,
        docId: foundCard._id,
        action: foundCard.verified ? 'card.verified' : 'card.unverified',
        docModel: "Card",
        docTitle: foundCard.title,
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

    const foundCard = await Card.findById(id);
    if (!foundCard) return res.sendStatus(404);

    await checkBoardPermission({
        boardId: foundCard.boardId.toString(),
        userId,
        resource: "card",
        action: "edit"
    });

    const prevDueDate = dateFormatter(foundCard.dueDate) || "none";
    foundCard.dueDate = req.body.dueDate;
    const newCard = await foundCard.save();

    await saveBoardActivity({
        boardId: newCard.boardId,
        userId,
        docId: newCard._id,
        action: "card.due_date_updated",
        docModel: "Card",
        docTitle: foundCard.title,
        description: `${prevDueDate} → ${dateFormatter(newCard.dueDate)}`,
    })

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
