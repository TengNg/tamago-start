import Board from "../models/Board.js";
import BoardActivity from "../models/BoardActivity.js";
import { checkAllowedRoles } from '../services/boardPermissionService.js';

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const getBoardActivities = async (req, res) => {
    const { id: boardId } = req.params;
    const foundBoard = await Board.findById(boardId).lean();
    if (!foundBoard) {
        return res.sendStatus(404);
    }

    await checkAllowedRoles({
        roles: ["member", "owner"],
        userId: req.user.userId,
        boardId: foundBoard._id.toString()
    });

    const perPage = 20;
    const page = typeof req.query.page === 'string'? parseInt(req.query.page, 10) : 1;

    const activities = await BoardActivity
        .find({ board: boardId })
        .populate({
            path: 'user',
            select: '-_id username createdAt'
        })
        .populate({
            path: 'doc',
            select: '_id title',
        })
        .sort({ createdAt: 'desc' })
        .skip((page - 1) * perPage)
        .limit(perPage + 1)
        .lean();

    const hasMore = activities.length > perPage;
    const items = hasMore ? activities.slice(0, perPage) : activities;
    const nextPage = hasMore ? page + 1 : null;

    return res.json({ activities: items, nextPage });
};

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const deleteAllBoardActivities = async (req, res) => {
    const { userId } = req.user;
    const { id: boardId } = req.params;
    const foundBoard = await Board.findById(boardId);
    if (!foundBoard) {
        return res.sendStatus(404);
    }

    if (foundBoard.createdBy.toString() !== userId) {
        return res.status(401).json({ message: 'Not authorize' });
    }

    await BoardActivity.deleteMany({ board: foundBoard._id });
    return res.sendStatus(204);
};

export {
    getBoardActivities,
    deleteAllBoardActivities
};
