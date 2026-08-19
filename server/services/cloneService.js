import mongoose from "mongoose";
import Board from "../models/Board.js";
import List from "../models/List.js";
import Card from "../models/Card.js";
import BoardMembership from "../models/BoardMembership.js";
import { generateListOrder } from "./listService.js";
import { generateCardOrder } from "./cardService.js";
import saveBoardActivity from "./saveBoardActivity.js";

/**
 * @typedef {import('mongoose').Types.ObjectId} ObjectId
 * @typedef {import('mongoose').mongo.ClientSession} ClientSession
 *
 * @typedef {{
 *   _id: ObjectId;
 *   title: string;
 *   description: string;
 * }} BoardDoc
 *
 * @typedef {{
 *   _id: ObjectId;
 *   title: string;
 *   boardId: ObjectId;
 * }} ListDoc
 *
 * @typedef {{
 *   _id: ObjectId;
 *   boardId: ObjectId;
 *   listId: ObjectId;
 *   title: string;
 *   description?: string;
 *   order: string;
 *   highlight?: string | null;
 *   priorityLevel?: string;
 *   verified?: boolean;
 * }} CardDoc
 */

/**
 * Build a single copied card document. Preserves content fields but
 * intentionally skips `owner` and `dueDate`.
 * @param {CardDoc} card
 * @param {ObjectId} boardId
 * @param {ObjectId} listId
 * @returns {object}
 */
function buildCard(card, boardId, listId) {
    return {
        _id: new mongoose.Types.ObjectId(),
        title: card.title,
        description: card.description,
        order: card.order,
        highlight: card.highlight,
        priorityLevel: card.priorityLevel,
        verified: card.verified,
        boardId,
        listId,
    };
}

/**
 * @param {CardDoc[]} cards
 * @param {ObjectId} boardId
 * @param {ObjectId} listId
 * @returns {object[]}
 */
function buildCardDocs(cards, boardId, listId) {
    return cards.map((card) => buildCard(card, boardId, listId));
}

/**
 * @param {{
 *   board: BoardDoc;
 *   title: string;
 *   description: string;
 *   userId: string;
 *   session: ClientSession;
 * }} params
 */
async function cloneBoard({ board, title, description, userId, session }) {
    const newBoardId = new mongoose.Types.ObjectId();
    const newBoard = new Board({
        _id: newBoardId,
        title: title || board.title,
        description: description || board.description,
        createdBy: userId,
    });
    await newBoard.save({ session });

    await BoardMembership.create(
        [{ boardId: newBoardId, userId, role: 'owner' }],
        { session }
    );

    const sourceLists = await List.find({ boardId: board._id }).lean();
    const oldToNewListId = new Map();
    const listDocs = sourceLists.map((list) => {
        const newListId = new mongoose.Types.ObjectId();
        oldToNewListId.set(list._id.toString(), newListId);
        return { _id: newListId, title: list.title, order: list.order, boardId: newBoardId };
    });
    if (listDocs.length > 0) {
        await List.insertMany(listDocs, { session });
    }

    const sourceCards = await Card
        .find({ listId: { $in: sourceLists.map((list) => list._id) } })
        .lean();
    const cardDocs = sourceCards.map((card) =>
        buildCard(/** @type {CardDoc} */(card), newBoardId, oldToNewListId.get(card.listId.toString())),
    );
    if (cardDocs.length > 0) {
        await Card.insertMany(cardDocs, { session });
    }

    await Board.updateOne(
        { _id: newBoardId },
        {
            $set: {
                'stats.listCount': listDocs.length,
                'stats.cardCount': cardDocs.length,
            },
        },
        { session }
    );

    return { board: newBoard, lists: listDocs, cards: cardDocs };
};

/**
 * @param {{
 *   list: ListDoc;
 *   prevListId?: string;
 *   nextListId?: string;
 *   userId: string;
 *   session: ClientSession;
 * }} params
 */
async function cloneList({ list, prevListId, nextListId, userId, session }) {
    const boardId = list.boardId;

    const boardAfterList = await Board.findOneAndUpdate(
        {
            _id: boardId,
            $expr: { $lt: ["$stats.listCount", "$limits.maxLists"] },
        },
        { $inc: { "stats.listCount": 1 } },
        { session, new: true },
    );
    if (!boardAfterList) {
        throw {
            status: 400,
            message: "Maximum list count reached for this board",
        };
    }

    const order = await generateListOrder({
        boardId: boardId.toString(),
        prevListId: prevListId || null,
        nextListId: nextListId || null,
        session,
    });

    const newList = new List({
        _id: new mongoose.Types.ObjectId(),
        title: list.title,
        order,
        boardId,
    });
    await newList.save({ session });

    const sourceCards = await Card.find({ boardId, listId: list._id }).lean();
    const cardDocs = buildCardDocs(
        /** @type {CardDoc[]} */(sourceCards),
        boardId,
        newList._id,
    );
    const copiedCards = cardDocs.length > 0
        ? await Card.insertMany(cardDocs, { session })
        : [];

    await Board.updateOne(
        { _id: boardId },
        { $inc: { 'stats.cardCount': copiedCards.length } },
        { session }
    );

    await saveBoardActivity({
        boardId,
        userId,
        docId: newList._id,
        action: 'list.copied',
        docModel: 'List',
        docTitle: newList.title,
        description: `a copy of "${newList.title}" created`,
        session,
    });

    return { list: newList, cards: copiedCards };
};

/**
 * @param {{
 *   card: CardDoc;
 *   prevCardId?: string;
 *   nextCardId?: string;
 *   userId: string;
 *   session: ClientSession;
 * }} params
 */
async function cloneCard({ card, prevCardId, nextCardId, userId, session }) {
    const order = await generateCardOrder({
        listId: card.listId.toString(),
        prevCardId: prevCardId || null,
        nextCardId: nextCardId || null,
        session,
    });

    const [newCard] = await Card.create(
        [{ ...buildCard(card, card.boardId, card.listId), order }],
        { session }
    );

    await saveBoardActivity({
        boardId: card.boardId,
        userId,
        docId: newCard._id,
        action: 'card.copied',
        docModel: 'Card',
        docTitle: card.title,
        description: `a copy of "${card.title}" created`,
        session,
    });

    return newCard;
};

export {
    cloneBoard,
    cloneList,
    cloneCard,
}
