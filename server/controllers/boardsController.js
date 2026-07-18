import mongoose from "mongoose";
import Board from "../models/Board.js";
import List from "../models/List.js";
import Card from "../models/Card.js";
import User from "../models/User.js";
import BoardMembership from "../models/BoardMembership.js";
import Attachment from "../models/Attachment.js";
import CardComment from "../models/CardComment.js";
import saveBoardActivity from '../services/saveBoardActivity.js';
import { checkAllowedRoles } from '../services/boardPermissionService.js';

/**
 * @param {import('mongoose').Types.ObjectId} boardId
 */
const boardMemberships = async (boardId) => {
    const memberships = await BoardMembership.aggregate([
        { $match: { boardId } },
        {
            $lookup: {
                from: 'users',
                localField: 'userId',
                foreignField: '_id',
                as: 'user'
            }
        },
        { $unwind: '$user' },
        {
            $project: {
                role: 1,
                createdAt: 1,
                userId: '$user._id',
                username: '$user.username'
            }
        }
    ]);
    return memberships;
}

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const getBoards = async (req, res) => {
    const { userId } = req.user;
    const { filter } = req.query;

    const userBoardIds = await BoardMembership.find({ userId })
        .distinct('boardId');

    if (userBoardIds.length === 0) {
        return res.json({
            boards: [],
            total: 0,
            totalOwned: 0,
            totalJoined: 0,
            recentlyViewedBoard: null,
        });
    }

    const boards = await Board.find({ _id: { $in: userBoardIds } })
        .sort({ title: 'asc' })
        .lean();

    const membershipCounts = await BoardMembership.aggregate([
        { $match: { boardId: { $in: userBoardIds } } },
        { $group: { _id: '$boardId', memberCount: { $sum: 1 } } }
    ]);

    const countMap = {};
    membershipCounts.forEach(item => {
        countMap[item._id.toString()] = item.memberCount;
    });

    const mapped = boards.map(board => ({
        ...board,
        owned: board.createdBy.toString() === userId.toString(),
        memberCount: countMap[board._id.toString()] || 1,
    }));

    const ownedBoardsCount = mapped.filter(b => b.owned).length;
    const joinedBoardsCount = mapped.length - ownedBoardsCount;

    let filtered = [...mapped].filter(board => {
        return filter === "joined"
            ? !board.owned
            : filter === "owned"
                ? board.owned
                : board
    });

    const foundUser = await User.findById(userId);
    const recentlyViewedBoardMembership = await BoardMembership.findOne({
        userId: foundUser?._id,
        boardId: foundUser?.recentlyViewedBoardId,
    }).populate({ path: 'boardId' });

    return res.json({
        boards: filtered,
        total: mapped.length,
        totalOwned: ownedBoardsCount,
        totalJoined: joinedBoardsCount,
        recentlyViewedBoard: recentlyViewedBoardMembership?.boardId || null,
    });
};

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const getBoard = async (req, res) => {
    const { userId } = req.user;
    const { id } = req.params;

    const board = await Board.findById(id).populate({
        path: 'createdBy',
        select: 'username createdAt'
    });
    if (!board) {
        return res.sendStatus(404);
    }

    const hasAccess = await BoardMembership.exists({ boardId: id, userId: userId });
    const isPublic = board.visibility === 'public';
    const isOwner = board.createdBy.toString() === userId.toString();
    const canAccess = isPublic || isOwner || hasAccess;
    if (!canAccess) {
        return res.status(403).json({ message: 'You do not have permission to access this board' });
    }

    const lists = await List.find({ boardId: board._id }).sort({ order: "asc" });
    const cards = await Card.find({ boardId: board._id }).sort({ order: "asc" });
    const cardsByListId = cards.reduce((acc, card) => {
        const listId = card.listId ? card.listId.toString() : "unknown";
        if (!acc[listId]) acc[listId] = [];
        acc[listId].push(card);
        return acc;
    }, {});
    lists.forEach(list => {
        const listId = list._id.toString();
        cardsByListId[listId] ??= [];
    });

    // update recently viewed board
    const foundUser = await User.findById(userId);
    if (foundUser.recentlyViewedBoardId !== board._id) {
        foundUser.recentlyViewedBoardId = board._id;
        await foundUser.save();
    }

    const memberships = await boardMemberships(board._id);
    const ownerFound = memberships.find(m => m.role === "owner");
    if (!ownerFound) {
        return res.status(400).json({ message: "abandoned board" });
    }

    const isMember = memberships.find(m => m.userId.toString() === userId);
    if (board.visibility !== "public" && !isMember) {
        return res.status(400).json({ message: "your're not a member of this board" });
    }

    return res.json({
        board,
        lists,
        cards: cardsByListId,
        members: memberships,
    });
}

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const getBoardStats = async (req, res) => {
    const { id } = req.params;
    const { userId } = req.user;

    const foundBoard = await Board.findById(id)
        .populate({
            path: 'createdBy',
            select: '_id username'
        })
        .lean();

    if (!foundBoard) {
        return res.sendStatus(404);
    }

    const memberships = await boardMemberships(foundBoard._id);
    const isMember = memberships.some(m => m.userId.toString() === userId);
    if (!isMember) {
        return res.status(403).json({ message: "unauthorized" });
    }

    const priorityLevelStats = await Card.aggregate([
        {
            $match: {
                boardId: mongoose.Types.ObjectId.createFromHexString(id),
            }
        },
        {
            $group: {
                _id: {
                    $cond: {
                        if: {
                            $or: [
                                { $eq: [{ $ifNull: ['$priorityLevel', null] }, null] },
                                { $eq: ['$priorityLevel', undefined] },
                                { $eq: ['$priorityLevel', ''] },
                            ]
                        },
                        then: 'none',
                        else: '$priorityLevel',
                    }
                },
                count: { $sum: 1 }
            }
        }
    ]);

    const listCount = await List.countDocuments({ boardId: id });

    const today = new Date();
    today.setHours(0, 0, 0, 0)
    const staleCardCount = await Card.countDocuments({
        boardId: id,
        dueDate: { $lt: today }
    });

    res.status(200).json({
        board: foundBoard,
        members: memberships,
        listCount,
        priorityLevelStats,
        staleCardCount
    });
};

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const createBoard = async (req, res) => {
    const { userId } = req.user;
    const { title, description } = req.body;

    const newBoard = await Board.create({
        title,
        description,
        createdBy: userId
    });

    await BoardMembership.create({
        boardId: newBoard._id,
        userId: newBoard.createdBy,
        role: 'owner',
    });

    return res.status(201).json(newBoard);
};

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const updateBoard = async (req, res) => {
    const { id } = req.params;
    const { field, value } = req.body;
    const { userId } = req.user;

    const allowedFields = ["title", "description", "visibility"];
    if (!allowedFields.includes(field)) {
        return res.status(400).json({ message: "Invalid field to update" });
    }

    const board = await Board.findById(id);
    if (!board) {
        return res.sendStatus(404);
    }

    await checkAllowedRoles({
        roles: ["owner"],
        userId,
        boardId: board._id.toString()
    });

    if (board[field] === value) {
        return res.status(200).json(board);
    }

    const prevValue = board[field];
    board[field] = value;
    await board.save();

    const actionMap = {
        title: "board.title_updated",
        description: "board.description_updated",
        visibility: "board.visibility_updated",
    };
    const description = `"${prevValue}" → "${value}"`.trim();

    await saveBoardActivity({
        boardId: id,
        userId,
        docId: id,
        action: actionMap[field] || "board.updated",
        docModel: "Board",
        docTitle: board.title,
        description,
    });

    return res.json(board);
};

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const leaveBoard = async (req, res) => {
    const { userId } = req.user;
    const { id } = req.params;

    const board = await Board.findById(id);
    if (!board) {
        return res.sendStatus(404);
    }

    await checkAllowedRoles({
        roles: ["member"],
        userId,
        boardId: board._id.toString()
    });

    const foundBoardMembership = await BoardMembership
        .findOne({ boardId: board._id, userId })
        .populate({
            path: "userId",
            select: "username",
        })
    if (!foundBoardMembership) {
        return res.sendStatus(404);
    }

    const username = /** @type any */(foundBoardMembership.userId).username;

    await BoardMembership.deleteOne({ boardId: board._id, userId });

    await saveBoardActivity({
        boardId: id,
        userId,
        docId: id,
        action: "board.member_left",
        docModel: "Board",
        docTitle: "",
        description: `${username} left`,
    })

    res.sendStatus(204);
};

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const removeMemberFromBoard = async (req, res) => {
    const { userId } = req.user;
    const { id, memberId } = req.params;

    const board = await Board.findById(id);
    if (!board) {
        return res.sendStatus(404);
    }

    const membership = await checkAllowedRoles({
        roles: ["owner"],
        userId,
        boardId: board._id.toString()
    });

    const foundMember = await User.findById(memberId);
    if (!foundMember) {
        return res.status(403).json({ message: 'member not found' });
    }

    if (foundMember._id.toString() === /** @type any */(membership).userId.toString()) {
        return res.status(403).json({ message: 'cannot remove yourself' });
    }

    await BoardMembership.deleteOne({
        boardId: board._id,
        userId: foundMember._id,
        role: 'member'
    });

    res.status(200).json({ message: 'Member removed from the board successfully' });
};

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const closeBoard = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { userId } = req.user;
        const { id } = req.params;

        const board = await Board.findById(id);
        if (!board) {
            return res.sendStatus(404);
        }

        await checkAllowedRoles({
            roles: ["owner"],
            userId,
            boardId: id,
        });

        await Card.deleteMany({ boardId: id }, { session });
        await List.deleteMany({ boardId: id }, { session });
        await BoardMembership.deleteMany({ boardId: id }, { session });

        const cardIds = await Card.find({ boardId: id }).distinct('_id').session(session);
        if (cardIds.length > 0) {
            await Attachment.deleteMany({ docModel: 'Card', doc: { $in: cardIds } }, { session });
            await CardComment.deleteMany({ cardId: { $in: cardIds } }, { session });
        }

        await Board.deleteOne({ _id: id }, { session });

        await session.commitTransaction();

        res.status(200).json({ message: 'board closed' });
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
const copyBoard = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { id } = req.params;
        const { title, description } = req.body;
        const { userId } = req.user

        const board = await Board.findById(id);
        if (!board) {
            return res.sendStatus(404);
        }

        await checkAllowedRoles({
            roles: ["owner", "member"],
            userId,
            boardId: board._id.toString()
        });

        // create board
        const newBoardId = new mongoose.Types.ObjectId();
        const newBoard = new Board({
            _id: newBoardId,
            title: title || board.title,
            description: description || board.description,
            createdBy: userId,
        });
        await newBoard.save({ session });

        // create membership
        const newMembership = new BoardMembership({
            boardId: newBoardId,
            userId,
            role: 'owner',
        });
        await newMembership.save({ session });

        // create lists
        const oldToNewListId = new Map();
        const lists = await List.find({ boardId: board._id });
        const listDocs = lists.map(list => {
            const newListId = new mongoose.Types.ObjectId();
            oldToNewListId.set(list._id.toString(), newListId);
            return { _id: newListId, title: list.title, order: list.order, boardId: newBoardId };
        });
        if (listDocs.length > 0) {
            await List.insertMany(listDocs, { session });
        }

        // create cards
        const allCards = await Card.find({ listId: { $in: lists.map(l => l._id) } }).lean();
        const cardDocs = allCards.map(card => ({
            title: card.title,
            description: card.description,
            order: card.order,
            highlight: card.highlight,
            priorityLevel: card.priorityLevel,
            boardId: newBoardId,
            listId: oldToNewListId.get(card.listId.toString()),
        }));
        if (cardDocs.length > 0) {
            await Card.insertMany(cardDocs, { session });
        }

        await session.commitTransaction();

        return res.sendStatus(204);
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
const getListCount = async (req, res) => {
    const { id } = req.params;

    const foundBoard = await Board.findById(id);
    if (!foundBoard) {
        return res.status(403).json({ message: 'board not found' });
    }

    const count = await List.countDocuments({ boardId: id });
    return res.status(200).json({ count });
};

export {
    getBoards,
    getBoardStats,
    createBoard,
    getBoard,
    updateBoard,
    leaveBoard,
    removeMemberFromBoard,
    closeBoard,
    copyBoard,
    getListCount,
};
