import Invitation from "../models/Invitation.js";
import User from "../models/User.js";
import Board from "../models/Board.js";
import BoardMembership from "../models/BoardMembership.js";

import { MAX_INVITATION_PAGE } from '../data/limits.js';

/**
 * @param {string} username
 */
const getUser = (username) => {
    const foundUser = User.findOne({ username }).lean();
    return foundUser;
};

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const getInvitations = async (req, res) => {
    const { userId } = req.user;
    const perPage = MAX_INVITATION_PAGE;
    let { page } = req.query;
    const pageNum = Number(Array.isArray(page) ? page[0] : page) || 1;

    const total = await Invitation.countDocuments({
        invitedUserId: userId
    });

    const invitations = await Invitation
        .find({ invitedUserId: userId })
        .populate({
            path: 'invitedUserId',
            select: 'username profileImage createdAt'
        })
        .populate({
            path: 'invitedByUserId',
            select: 'username profileImage createdAt'
        })
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * perPage)
        .limit(perPage)
        .lean();

    const hasMore = pageNum * perPage < total;

    res.status(200).json({ invitations, hasMore });
};

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const sendInvitation = async (req, res) => {
    const { username } = req.user;
    const { boardId, receiverName } = req.body;

    const sender = await getUser(username);
    if (!sender) {
        return res.status(403).json({ message: "can't send invitation" });
    }

    const receiver = await getUser(receiverName);
    if (!receiver) {
        return res.status(403).json({ message: "username is not found" });
    }

    if (username === receiverName) {
        return res.status(409).json({ message: "can't send invitation" });
    }

    const receiverBoardMembership = await BoardMembership.findOne({ boardId, userId: receiver._id });
    if (receiverBoardMembership) {
        return res.status(409).json({ message: "this user is already in this board" });
    }

    const foundInvitation = await Invitation
        .findOne({
            boardId,
            invitedByUserId: sender._id,
            invitedUserId: receiver._id,
            status: { $in: ['pending'] }
        })
        .sort({ createdAt: -1 })

    if (foundInvitation) return res.status(409).json({ message: "invitation is already sent" }); // Conflict

    const invitation = new Invitation({
        boardId,
        invitedUserId: receiver._id,
        invitedByUserId: sender._id,
    })

    await invitation.save();
    res.status(201).json(invitation);
};

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const acceptInvitation = async (req, res) => {
    const { id } = req.params;

    let invitation = await Invitation.findById(id);
    if (!invitation) {
        return res.status(404).json({ message: 'Invitation not found' });
    }

    const { boardId, invitedUserId } = invitation;
    const board = await Board.findById(boardId);
    if (!board) {
        return res.status(404);
    }

    await BoardMembership.create({
        boardId,
        userId: invitedUserId,
        role: 'member',
    });

    res.json({ invitation });
}

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const rejectInvitation = async (req, res) => {
    const { id } = req.params;

    const invitation = await Invitation.findByIdAndUpdate(
        id,
        { status: 'rejected' },
        { new: true }
    );

    res.json({ invitation });
}

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const removeInvitation = async (req, res) => {
    const { id } = req.params;

    const removed = await Invitation.findByIdAndDelete(id);

    if (!removed) {
        return res.status(404).json({ message: 'Invitation not found' });
    }

    res.status(200).json({ message: 'Invitation removed successfully' });
};

export {
    getInvitations,
    sendInvitation,
    acceptInvitation,
    rejectInvitation,
    removeInvitation,
};
