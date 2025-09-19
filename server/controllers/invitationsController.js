const Invitation = require("../models/Invitation");
const User = require("../models/User");
const Board = require("../models/Board");
const BoardMembership = require("../models/BoardMembership");

const { MAX_BOARD_MEMBER_COUNT, MAX_INVITATION_PAGE } = require('../data/limits');

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

    res.status(200).json({ invitations });
};

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const sendInvitation = async (req, res) => {
    const { username } = req.user;
    const sender = await getUser(username);
    if (!sender) return res.status(403).json({ msg: "can't send invitation" });

    const { boardId, receiverName } = req.body;

    const receiver = await getUser(receiverName);
    if (!receiver) return res.status(404).json({ msg: "username is not found" });

    if (username === receiverName) return res.status(409).json({ msg: "can't send invitation" });

    const board = await Board.findById(boardId);
    if (board.members.indexOf(receiver._id) !== -1) return res.status(409).json({ msg: "this user is already in this board" });

    const foundInvitation = await Invitation
        .findOne({
            boardId,
            invitedByUserId: sender._id,
            invitedUserId: receiver._id,
            status: { $in: ['pending'] }
        })
        .sort({ createdAt: -1 })

    if (foundInvitation) return res.status(409).json({ msg: "invitation is already sent" }); // Conflict

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
        return res.status(404).json({ msg: 'Invitation not found' });
    }

    const { boardId, invitedUserId } = invitation;
    const board = await Board.findById(boardId);
    if (!board) {
        return res.status(404).json({ msg: 'Board not found' });
    }

    if (board.members.length >= MAX_BOARD_MEMBER_COUNT) {
        return res.status(409).json({ msg: 'Board is full' });
    }

    try {
        await BoardMembership.create({
            boardId,
            userId: invitedUserId,
            role: 'member',
        });
    } catch {
        return res.status(409).json({ msg: "You are already a member in this board" });
    }

    if (!board.members.includes(invitedUserId)) {
        board.members.push(invitedUserId);
        invitation.status = 'accepted';
        await board.save();
        await invitation.save();
    } else {
        return res.status(409).json({ msg: 'Failed to associate member to the board' });
    }

    res.json({ invitation });
}

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
        return res.status(404).json({ msg: 'Invitation not found' });
    }

    res.status(200).json({ msg: 'Invitation removed successfully' });
};

module.exports = {
    getInvitations,
    sendInvitation,
    acceptInvitation,
    rejectInvitation,
    removeInvitation,
};
