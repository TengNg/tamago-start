const mongoose = require('mongoose');
const Board = require("../models/Board");
const BoardMembership = require("../models/BoardMembership");
const JoinBoardRequest = require("../models/JoinBoardRequest");
const { userByUsername: getUser } = require('../services/userService');

const { MAX_REQUEST_PAGE } = require('../data/limits');

const findUser = async (req, res) => {
    const { username } = req.user;
    const foundUser = await getUser(username);
    if (!foundUser) return res.status(403).json({ message: "user not found" });
    return foundUser;
};

const findBoard = async (req, res) => {
    const { boardId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(boardId)) return res.status(403).json({ message: "board not found, invalid id" });

    const foundBoard = await Board.findById(boardId);
    if (!foundBoard) return res.status(403).json({ message: "board not found" });
    return foundBoard;
};

const findUserAndBoard = async (req, res) => {
    const foundUser = await findUser(req, res);
    const foundBoard = await findBoard(req, res);
    return { foundUser, foundBoard };
};

const findRequest = async (req, res) => {
    const { requestId } = req.params;
    const foundRequest = await JoinBoardRequest.findById(requestId);
    if (!foundRequest) return res.status(403).json({ message: "request not found" });
    return foundRequest;
};

const getAllRequests = async (req, res) => {
    const { userId } = req.user;

    const perPage = MAX_REQUEST_PAGE;
    let { page } = req.query;
    page = +page || 1;

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
        .skip((page - 1) * perPage)
        .limit(perPage)
        .lean();

    return res.json({ joinRequests });
};

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const getBoardRequests = async (req, res) => {
    const { foundUser: _foundUser, foundBoard } = await findUserAndBoard(req, res);
    const joinRequests = await JoinBoardRequest.find({ boardId: foundBoard._id }).populate('requester').lean();
    return res.json({ joinRequests });
};

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const sendRequest = async (req, res) => {
    const { foundUser, foundBoard } = await findUserAndBoard(req, res);

    const boardMembership = await BoardMembership.findOne({ boardId: foundBoard._id, foundUser: foundUser._id });
    if (boardMembership) {
        return res.status(409).json({ message: "you're already a member of this board" });
    }

    const joinRequestExists = await JoinBoardRequest.findOne({
        boardId: foundBoard._id,
        requester: foundUser._id,
        status: 'pending',
    });

    if (joinRequestExists) return res.status(409).json({ message: 'join request already sent' });

    const joinRequest = new JoinBoardRequest({
        boardId: foundBoard._id,
        requester: foundUser._id
    });

    await joinRequest.save();
    return res.status(201).json({ message: 'join request sent' });
};

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const acceptRequest = async (req, res) => {
    const { boardId, requesterName } = req.body;
    const requester = await getUser(requesterName);
    if (!requester) return res.status(403).json({ message: "requester not found" });

    const requesterBoardMembership = await BoardMembership.findOne({ boardId, userId: requester._id });
    if (requesterBoardMembership) {
        return res.status(409).json({ message: 'requester is already a member' });
    }

    const acceptedRequest = await findRequest(req, res);
    if (!acceptedRequest) {
        return res.status(403).json({ message: "request not found" });
    }

    acceptedRequest.status = 'accepted';
    acceptedRequest.save();

    return res.json({ message: 'request accepted' });
};

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const rejectRequest = async (req, res) => {
    const { boardId, requesterName } = req.body;
    const requester = await getUser(requesterName);
    if (!requester) return res.status(403).json({ message: "requester not found" });


    const requesterBoardMembership = await BoardMembership.findOne({ boardId, userId: requester._id });
    if (requesterBoardMembership) {
        return res.status(409).json({ message: 'requester is already a member' });
    }

    const rejectedRequest = await findRequest(req, res);
    if (!rejectedRequest) return res.status(403).json({ message: "request not found" });

    rejectedRequest.status = 'rejected';
    rejectedRequest.save();

    return res.json({ message: 'request rejected' });
};

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const removeRequest = async (req, res) => {
    const removedRequest = await findRequest(req, res);
    if (!removedRequest) return res.status(403).json({ message: "request not found" });

    await JoinBoardRequest.deleteOne({ _id: removedRequest._id });

    return res.json({ message: 'request removed' });
};

module.exports = {
    getAllRequests,
    getBoardRequests,
    sendRequest,
    acceptRequest,
    rejectRequest,
    removeRequest,
};

