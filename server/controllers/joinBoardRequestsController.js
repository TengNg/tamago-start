import User from "../models/User.js";
import Board from "../models/Board.js";
import BoardMembership from "../models/BoardMembership.js";
import JoinBoardRequest from "../models/JoinBoardRequest.js";

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const getAllRequests = async (req, res) => {
    const perPage = 10;

    const { userId } = req.user;

    let { page } = req.query;
    const pageNum = Number(Array.isArray(page) ? page[0] : page) || 1;

    const ownedBoardIds = await Board.find({ createdBy: userId }).distinct('_id').lean();

    const joinRequests = await JoinBoardRequest
        .find({
            boardId: { $in: ownedBoardIds }
        })
        .populate({
            path: 'requester',
            select: 'username profileImage createdAt'
        })
        .populate({
            path: 'boardId',
            select: 'title description visibility listCount',
            populate: {
                path: 'createdBy',
                select: 'username'
            }
        })
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * perPage)
        .limit(perPage + 1)
        .lean();

    const hasMore = joinRequests.length > perPage;
    const items = hasMore ? joinRequests.slice(0, perPage) : joinRequests;
    const nextPage = hasMore ? pageNum + 1 : null;

    return res.json({ joinRequests: items, nextPage });
};

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const getBoardRequests = async (req, res) => {
    const { boardId } = req.body;
    const foundBoard = await Board.findById(boardId);
    if (!foundBoard) {
        return res.status(403).json({ message: "board not found" });
    }

    const joinRequests = await JoinBoardRequest
        .find({ boardId: foundBoard._id })
        .populate('requester')
        .lean();

    return res.json({ joinRequests });
};

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const sendRequest = async (req, res) => {
    const { userId } = req.user;
    const { boardId } = req.body;

    const foundBoard = await Board.findById(boardId);
    if (!foundBoard) {
        return res.status(403).json({ message: "board not found" });
    }

    const boardMembership = await BoardMembership.findOne({ boardId: foundBoard._id, userId });
    if (boardMembership) {
        return res.status(409).json({ message: "you're already a member of this board" });
    }

    const joinRequestExists = await JoinBoardRequest.findOne({
        boardId: foundBoard._id,
        requester: userId,
        status: 'pending',
    });
    if (joinRequestExists) {
        return res.status(409).json({ message: 'join request already sent' });
    }

    const joinRequest = new JoinBoardRequest({
        boardId: foundBoard._id,
        requester: userId
    });

    await joinRequest.save();
    return res.sendStatus(201);
};

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const acceptRequest = async (req, res) => {
    const { boardId, requesterId } = req.body;

    const requester = await User.findById(requesterId);
    if (!requester) {
        return res.status(403).json({ message: "requester not found" });
    }

    const requesterBoardMembership = await BoardMembership.findOne({ boardId, userId: requester._id });
    if (requesterBoardMembership) {
        return res.status(409).json({ message: 'requester is already a member' });
    }

    const { requestId } = req.params;
    const acceptedRequest = await JoinBoardRequest.findById(requestId);
    if (!acceptedRequest) {
        return res.sendStatus(404);
    }

    acceptedRequest.status = 'accepted';
    acceptedRequest.save();

    return res.sendStatus(204);
};

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const rejectRequest = async (req, res) => {
    const { boardId, requesterId } = req.body;

    const requester = await User.findById(requesterId);
    if (!requester) {
        return res.status(403).json({ message: "requester not found" });
    }

    const requesterBoardMembership = await BoardMembership.findOne({ boardId, userId: requester._id });
    if (requesterBoardMembership) {
        return res.status(409).json({ message: 'requester is already a member' });
    }

    const { requestId } = req.params;
    const rejectedRequest = await JoinBoardRequest.findById(requestId);
    if (!rejectedRequest) {
        return res.sendStatus(404);
    }

    rejectedRequest.status = 'rejected';
    rejectedRequest.save();

    return res.sendStatus(204);
};

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const removeRequest = async (req, res) => {
    const { requestId } = req.params;
    const removedRequest = await JoinBoardRequest.findById(requestId);
    if (!removedRequest) {
        return res.sendStatus(404);
    }

    await JoinBoardRequest.deleteOne({ _id: removedRequest._id });

    return res.sendStatus(204);
};

export {
    getAllRequests,
    getBoardRequests,
    sendRequest,
    acceptRequest,
    rejectRequest,
    removeRequest,
};

