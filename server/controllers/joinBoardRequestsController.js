import User from "../models/User.js";
import Board from "../models/Board.js";
import BoardMembership from "../models/BoardMembership.js";
import JoinBoardRequest from "../models/JoinBoardRequest.js";
import { checkAllowedRoles } from "../services/boardPermissionService.js";

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
    const { userId } = req.user;
    const { boardId } = req.body;
    const foundBoard = await Board.findById(boardId);
    if (!foundBoard) {
        return res.status(403).json({ message: "board not found" });
    }

    await checkAllowedRoles({
        roles: ["owner"],
        userId,
        boardId: foundBoard._id.toString(),
    });

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
    const { userId } = req.user;
    const { boardId, requesterId } = req.body;
    const { requestId } = req.params;

    const board = await Board.findById(boardId);
    if (!board) {
        return res.status(403).json({ message: "board not found" });
    }

    await checkAllowedRoles({
        roles: ["owner"],
        userId,
        boardId: board._id.toString(),
    });

    const acceptedRequest = await JoinBoardRequest.findById(requestId);
    if (!acceptedRequest) {
        return res.sendStatus(404);
    }

    if (
        acceptedRequest.boardId.toString() !== board._id.toString() ||
        acceptedRequest.requester.toString() !== requesterId
    ) {
        return res.status(400).json({ message: "request does not match this board/requester" });
    }

    const requester = await User.findById(requesterId);
    if (!requester) {
        return res.status(403).json({ message: "requester not found" });
    }

    const requesterBoardMembership = await BoardMembership.findOne({ boardId, userId: requester._id });
    if (requesterBoardMembership) {
        return res.status(409).json({ message: 'requester is already a member' });
    }

    const membershipCount = await BoardMembership.countDocuments({ boardId });
    if (membershipCount >= board.limits.maxMembers) {
        const msg = `Maximum member count reached for this board (maximum: ${board.limits.maxMembers})`;
        return res.status(400).json({ message: msg });
    }

    acceptedRequest.status = 'accepted';
    await acceptedRequest.save();

    await BoardMembership.create({
        boardId,
        userId: requester._id,
        role: 'member',
    });

    return res.sendStatus(204);
};

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const rejectRequest = async (req, res) => {
    const { userId } = req.user;
    const { boardId } = req.body;
    const { requestId } = req.params;

    const board = await Board.findById(boardId);
    if (!board) {
        return res.status(403).json({ message: "board not found" });
    }

    await checkAllowedRoles({
        roles: ["owner"],
        userId,
        boardId: board._id.toString(),
    });

    const rejectedRequest = await JoinBoardRequest.findById(requestId);
    if (!rejectedRequest) {
        return res.sendStatus(404);
    }

    if (rejectedRequest.boardId.toString() !== board._id.toString()) {
        return res.status(400).json({ message: "request does not belong to this board" });
    }

    rejectedRequest.status = 'rejected';
    await rejectedRequest.save();

    return res.sendStatus(204);
};

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const removeRequest = async (req, res) => {
    const { userId } = req.user;
    const { requestId } = req.params;
    const removedRequest = await JoinBoardRequest.findById(requestId);
    if (!removedRequest) {
        return res.sendStatus(404);
    }

    await checkAllowedRoles({
        roles: ["owner"],
        userId,
        boardId: removedRequest.boardId.toString(),
    });

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

