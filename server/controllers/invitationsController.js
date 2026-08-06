import Invitation from "../models/Invitation.js";
import User from "../models/User.js";
import Board from "../models/Board.js";
import BoardMembership from "../models/BoardMembership.js";

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const getInvitations = async (req, res) => {
    const perPage = 10;

    const { userId } = req.user;

    let { page } = req.query;
    const pageNum = Number(Array.isArray(page) ? page[0] : page) || 1;

    const invitations = await Invitation
        .find({
            invitedUserId: userId
        })
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
        .limit(perPage + 1)
        .lean();

    const hasMore = invitations.length > perPage;
    const items = hasMore ? invitations.slice(0, perPage) : invitations;
    const nextPage = hasMore ? pageNum + 1 : null;

    res.status(200).json({ invitations: items, nextPage });
};

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const sendInvitation = async (req, res) => {
    const { userId, username } = req.user;
    const { boardId, receiverName } = req.body;

    const board = await Board.findById(boardId);
    if (!board) {
        return res.status(404).json({ message: "board not found" });
    }

    const isMember = await BoardMembership.exists({ boardId, userId });
    if (!isMember) {
        return res.status(403).json({ message: "you must be a member of this board to send invitations" });
    }

    const receiver = await User.findOne({ username: receiverName }).lean();
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
            invitedByUserId: userId,
            invitedUserId: receiver._id,
            status: { $in: ['pending'] }
        })
        .sort({ createdAt: -1 })

    if (foundInvitation) {
        return res.status(409).json({ message: "invitation is already sent" }); // Conflict
    }

    const invitation = new Invitation({
        boardId,
        invitedUserId: receiver._id,
        invitedByUserId: userId,
    })

    await invitation.save();
    res.status(201).json(invitation);
};

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const acceptInvitation = async (req, res) => {
    const { userId } = req.user;
    const { id } = req.params;

    let invitation = await Invitation.findById(id);
    if (!invitation) {
        return res.status(404).json({ message: 'Invitation not found' });
    }

    if (invitation.invitedUserId.toString() !== userId) {
        return res.status(403).json({ message: 'This invitation is not for you' });
    }

    if (invitation.status !== 'pending') {
        return res.status(409).json({ message: 'This invitation has already been responded to' });
    }

    const { boardId, invitedUserId } = invitation;
    const board = await Board.findById(boardId);
    if (!board) {
        return res.status(404);
    }

    const isAlreadyMember = await BoardMembership.exists({ boardId, userId });
    if (isAlreadyMember) {
        return res.status(409).json({ message: "you're already a member of this board" });
    }

    const membershipCount = await BoardMembership.countDocuments({ boardId });
    if (membershipCount >= board.limits.maxMembers) {
        const msg = `Maximum member count reached for this board (maximum: ${board.limits.maxMembers})`;
        return res.status(400).json({ message: msg });
    }

    invitation.status = "accepted";
    await invitation.save();

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
    const { userId } = req.user;
    const { id } = req.params;

    const invitation = await Invitation.findById(id);
    if (!invitation) {
        return res.status(404).json({ message: 'Invitation not found' });
    }

    if (invitation.invitedUserId.toString() !== userId) {
        return res.status(403).json({ message: 'This invitation is not for you' });
    }

    if (invitation.status !== 'pending') {
        return res.status(409).json({ message: 'This invitation has already been responded to' });
    }

    invitation.status = 'rejected';
    await invitation.save();

    res.json({ invitation });
}

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const removeInvitation = async (req, res) => {
    const { userId } = req.user;
    const { id } = req.params;

    const invitation = await Invitation.findById(id);
    if (!invitation) {
        return res.sendStatus(404);
    }

    const isInvitedUser = invitation.invitedUserId.toString() === userId;
    const isInviter = invitation.invitedByUserId.toString() === userId;
    const isOwner = await BoardMembership.exists({
        boardId: invitation.boardId,
        userId,
        role: 'owner',
    });

    if (!isInvitedUser && !isInviter && !isOwner) {
        return res.status(403).json({ message: 'Not authorized to remove this invitation' });
    }

    await invitation.deleteOne();

    res.sendStatus(204);
};

export {
    getInvitations,
    sendInvitation,
    acceptInvitation,
    rejectInvitation,
    removeInvitation,
};
