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

    return res.json(foundCard);
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

    return res.status(201).json(newCard);
};

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const reorder = async (req, res) => {
    const { userId } = req.user;
    const { id } = req.params;
    const { rank, listId, oldPos, newPos } = req.body;

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
    await foundCard.save();

    await saveBoardActivity({
        userId,
        boardId: foundList.boardId,
        docId: foundCard._id,
        action: "card.moved",
        docModel: "Card",
        docTitle: foundCard.title,
        description: `${currentCardListTitle} (${oldPos}) → ${foundList.title} (${newPos})`,
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

    if (foundCard[field] === value) {
        return res.status(200).json(foundCard);
    }

    const prevValue = foundCard[field];
    foundCard[field] = value;
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
    const description = field === "verified"
        ? null
        : field === "dueDate"
        ? `${dateFormatter(prevValue) || "none"} → ${dateFormatter(value) || "none"}`
        : `"${prevValue}" → "${value}"`;

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

    res.sendStatus(204);
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

    return res.json(newCard);
};

export {
    getCard,
    addCard,
    deleteCard,
    reorder,
    copyCard,
    updateCard,
}
