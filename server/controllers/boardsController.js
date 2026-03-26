const mongoose = require('mongoose');
const Board = require("../models/Board");
const BoardMembership = require("../models/BoardMembership");
const List = require("../models/List");
const Card = require("../models/Card");
const User = require("../models/User");

const { userByUsername: getUser } = require('../services/userService');

const saveBoardActivity = require('../services/saveBoardActivity');

/**
 * @param {Object} params
 * @param {("owner" | "member")[]} params.roles
 * @param {string | import("mongoose").ObjectId} params.userId
 * @param {string | import("mongoose").ObjectId} params.boardId
 */
const checkAllowedRoles = async ({ roles, userId, boardId }) => {
    const allowed = await BoardMembership.findOne({
        userId,
        boardId,
        role: { $in: roles }
    });
    if (!allowed) {
        throw { status: 403, message: "unauthorized" }
    }

    return allowed;
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
        return res.status(404);
    }

    const hasAccess = await BoardMembership.exists({ boardId: id, userId: userId });
    const isPublic = board.visibility === 'public';
    const isOwner = board.createdBy.toString() === userId.toString();
    const canAccess = isPublic || isOwner || hasAccess;
    if (!canAccess) {
        return res.status(403).json({ message: 'You do not have permission to access this board' });
    }

    // sync list count
    const listCount = await List.countDocuments({ boardId: id });
    board.listCount = listCount;

    // sync card count
    const cardCount = await Card.countDocuments({ boardId: id });
    board.cardCount = cardCount;

    await board.save();

    const listsWithCards = await List.aggregate([
        {
            $match: {
                boardId: board._id
            }
        },
        {
            $lookup: {
                from: 'cards',
                let: { id: '$_id' },
                as: 'cards',
                pipeline: [
                    {
                        $match: {
                            $expr: { $eq: ['$listId', '$$id'] }
                        }
                    },
                    {
                        $sort: { order: 1 }
                    },
                    {
                        $project: { updatedAt: 0 }
                    }
                ]
            }
        },
        {
            $sort: { order: 1 }
        },
    ]);

    // update recently viewed board
    const foundUser = await User.findById(userId);
    if (foundUser.recentlyViewedBoardId !== board._id) {
        foundUser.recentlyViewedBoardId = board._id;
        foundUser.save();
    }

    const memberships = await BoardMembership
        .find({ boardId: board._id })
        .populate({
            path: 'userId',
            select: 'username role'
        }).lean()

    const ownerFound = memberships.find(m => m.role === "owner");
    if (!ownerFound) {
        return res.status(400).json({ message: "abandoned board" });
    }

    const isMember = memberships.find(m => m.userId._id.toString() === userId);
    if (board.visibility !== "public" && !isMember) {
        return res.status(400).json({ message: "your're not a member of this board" });
    }

    return res.json({
        board,
        lists: listsWithCards,
        members: memberships.map((m) => {
            return {
                username: /** @type any */(m.userId).username,
                role: m.role,
                createdAt: m.createdAt,
            }
        }),
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
        return res.status(403).json({ message: "board not found" });
    }

    const memberships = await BoardMembership.find({ boardId: foundBoard._id })
        .populate({
            path: "userId",
            select: "username"
        })
        .lean();
    const isMember = memberships.some(m => {
        return m.userId._id.toString() === userId
    });
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

    const today = new Date();
    today.setHours(0, 0, 0, 0)
    const staleCardCount = await Card.countDocuments({
        boardId: id,
        dueDate: { $lt: today }
    });

    res.status(200).json({
        board: foundBoard,
        members: memberships.map((m) => {
            const username = /** @type any */(m.userId).username
            return { username };
        }),
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
    const newBoard = new Board({
        title,
        description,
        createdBy: userId
    });
    await newBoard.save();
    return res.status(201).json({ message: 'new board created', newBoard });
};

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const updateTitle = async (req, res) => {
    const { id } = req.params;
    const { title } = req.body;
    const { userId } = req.user;

    const board = await Board.findById(id);
    if (!board) {
        return res.status(404);
    }

    await checkAllowedRoles({
        roles: ["owner"],
        userId,
        boardId: board._id.toString()
    });

    const currentTitle = board.title;
    board.title = title;
    board.save();

    if (title !== currentTitle) {
        await saveBoardActivity({
            boardId: id,
            userId,
            action: "update board title",
            type: "board",
            description: `${currentTitle} > ${title}`,
        })
    }

    return res.status(200).json({ message: 'board updated', newBoard: board });
};

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const updateDescription = async (req, res) => {
    const { id } = req.params;
    const { description } = req.body;
    const { userId } = req.user;

    const board = await Board.findById(id);
    if (!board) {
        return res.status(404);
    }

    await checkAllowedRoles({
        roles: ["owner"],
        userId,
        boardId: board._id.toString()
    });

    const currentDescription = board.description;
    board.description = description;
    board.save();

    if (description !== currentDescription) {
        await saveBoardActivity({
            boardId: id,
            userId,
            action: "update board description",
            type: "board",
            description: board.description,
        })
    }

    return res.status(200).json({ message: 'board updated', newBoard: board });
};

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const updateVisibility = async (req, res) => {
    const { id } = req.params;
    const { visibility } = req.body;
    const { userId } = req.user;

    const board = await Board.findById(id);
    if (!board) {
        return res.status(404);
    }

    await checkAllowedRoles({
        roles: ["owner"],
        userId,
        boardId: board._id.toString()
    });

    board.visibility = visibility;
    board.save();

    return res.status(200).json({ message: 'board updated', newBoard: board });
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
        return res.status(404);
    }

    await checkAllowedRoles({
        roles: ["member"],
        userId,
        boardId: board._id.toString()
    });

    const foundBoardMembership = await BoardMembership.findOne({ boardId: board._id, userId });
    if (!foundBoardMembership) {
        return res.status(404).json({ error: 'Member not found' });
    }

    await BoardMembership.deleteOne({ boardId: board._id, userId });
    res.status(200).json({ message: 'Member removed from the board successfully' });
};

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const removeMemberFromBoard = async (req, res) => {
    const { userId } = req.user;
    const { id, memberName } = req.params;

    const board = await Board.findById(id);
    if (!board) {
        return res.status(404);
    }

    const membership = await checkAllowedRoles({
        roles: ["owner"],
        userId,
        boardId: board._id.toString()
    });

    const foundMember = await getUser(memberName);
    if (!foundMember) {
        return res.status(403).json({ error: 'member not found' });
    }

    if (foundMember._id === membership.userId) {
        return res.status(403).json({ error: 'cannot remove yourself' });
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
            return res.status(404);
        }

        await checkAllowedRoles({
            roles: ["member"],
            userId,
            boardId: board._id.toString()
        });

        await Card.deleteMany({ boardId: id }, { session });
        await List.deleteMany({ boardId: id }, { session });
        await BoardMembership.deleteMany({ boardId: id }, { session });
        await Board.deleteOne({ _id: id }, { session });

        await session.commitTransaction();

        res.status(200).json({ message: 'board closed' });
    } catch (error) {
        await session.abortTransaction();
        const status = error.status || 400;
        res.status(status).json({ error: error.message });
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
            return res.status(404);
        }

        const allowed = await BoardMembership.exists({
            userId,
            boardId: board._id,
            role: "owner",
        });
        if (!allowed) {
            return res.status(403).json({ message: "unauthorized" });
        }

        const newBoardId = new mongoose.Types.ObjectId();
        const lists = await List.find({ boardId: board._id });

        const newBoard = new Board({
            _id: newBoardId,
            title: title || board.title,
            description: description || board.description,
            createdBy: userId,
        });

        await newBoard.save({ session });

        for (const list of lists) {
            const newListId = new mongoose.Types.ObjectId();
            const { _id, title, order } = list;
            const newList = new List({
                _id: newListId,
                title,
                order,
                boardId: newBoardId,
            });

            await newList.save({ session });

            const cards = await Card.find({ listId: _id });
            for (const card of cards) {
                const { title, description, order, highlight, priorityLevel } = card;
                const newCard = new Card({
                    title,
                    description,
                    order,
                    highlight,
                    priorityLevel,
                    boardId: newBoardId,
                    listId: newListId,
                });

                await newCard.save({ session });
            }
        }

        await session.commitTransaction();

        return res.status(200).json({ message: 'board copied' });
    } catch (error) {
        await session.abortTransaction();
        res.status(400).json({ error: error.message });
    } finally {
        session.endSession();
    }
};

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const togglePinBoard = async (req, res) => {
    const { userId } = req.user;
    const { id } = req.params;

    const foundBoard = await Board.findById(id);
    if (!foundBoard) {
        return res.status(404);
    }

    const foundUser = await User.findById(userId);
    if (!foundUser) {
        return res.status(403).json({ message: "user not found" });
    }

    if (foundUser.pinnedBoardIdCollection && foundUser.pinnedBoardIdCollection.has(id)) {
        const result = await User.findOneAndUpdate(
            { _id: userId },
            { $unset: { [`pinnedBoardIdCollection.${id}`]: 1 } },
            { new: true }
        ).select('pinnedBoardIdCollection');
        return res.status(200).json({ result });
    }

    const result = await User.findOneAndUpdate(
        { _id: userId },
        { $set: { [`pinnedBoardIdCollection.${id}`]: { title: foundBoard?.title } } },
        { new: true, upsert: true }
    ).select('pinnedBoardIdCollection');
    return res.status(200).json({ result });
};

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const deletePinnedBoard = async (req, res) => {
    const { userId } = req.user;
    const { id } = req.params;

    const foundUser = await User.findById(userId);
    if (!foundUser) {
        return res.status(403).json({ message: "user not found" });
    }

    if (foundUser.pinnedBoardIdCollection && foundUser.pinnedBoardIdCollection.has(id)) {
        const result = await User.findOneAndUpdate(
            { _id: userId },
            { $unset: { [`pinnedBoardIdCollection.${id}`]: 1 } },
            { new: true }
        ).select('pinnedBoardIdCollection');
        return res.status(200).json({ result });
    }

    return res.status(404).json({ message: 'pinned board not found' });
};

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const updatePinnedBoardsCollection = async (req, res) => {
    const { userId } = req.user;
    const { pinnedBoards } = req.body;

    const foundUser = await User.findById(userId);
    if (JSON.stringify(foundUser.pinnedBoardIdCollection) === JSON.stringify(pinnedBoards)) {
        return res.status(200).json({
            result: foundUser.pinnedBoardIdCollection,
        });
    }

    const result = await User.findOneAndUpdate(
        { _id: userId },
        { pinnedBoardIdCollection: pinnedBoards },
        { new: true }
    ).select('pinnedBoardIdCollection');

    return res.status(200).json({ result });
};

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const cleanPinnedBoardsCollection = async (req, res) => {
    const { userId } = req.user;
    const result = await User.findOneAndUpdate(
        { _id: userId },
        { pinnedBoardIdCollection: {} },
        { new: true }
    ).select('pinnedBoardIdCollection');

    return res.status(200).json({ result });
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

module.exports = {
    getBoards,
    getBoardStats,
    createBoard,
    getBoard,
    updateVisibility,
    updateTitle,
    updateDescription,
    leaveBoard,
    removeMemberFromBoard,
    closeBoard,
    copyBoard,
    togglePinBoard,
    deletePinnedBoard,
    cleanPinnedBoardsCollection,
    updatePinnedBoardsCollection,
    getListCount,
};
