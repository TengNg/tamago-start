const Board = require("../models/Board");
const BoardActivity = require("../models/BoardActivity");

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const getBoardActivities = async (req, res) => {
    const { boardId } = req.params;
    const foundBoard = await Board.findById(boardId).lean();
    if (!foundBoard) return res.status(404).json({ message: "board not found" });

    const { perPage, page } = req.query;
    const perPageNum = typeof perPage === 'string' ? parseInt(perPage, 10) : 10;
    const pageNum = typeof page === 'string' ? parseInt(page, 10) : 1;

    const activities = await BoardActivity
        .find({ board: boardId })
        .populate({
            path: 'user',
            select: '-_id username createdAt'
        })
        .populate({
            path: 'card',
            select: 'title'
        })
        .populate({
            path: 'list',
            select: '-_id title'
        })
        .sort({ createdAt: 'desc' })
        .skip((pageNum - 1) * perPageNum)
        .limit(perPageNum)
        .lean()

    return res.json({ activities });
};

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const deleteAllBoardActivities = async (req, res) => {
    const { userId } = req.user;
    const { boardId } = req.params;
    const foundBoard = await Board.findById(boardId);
    if (!foundBoard) return res.status(404).json({ message: "board not found" });

    if (foundBoard.createdBy.toString() !== userId) {
        return res.status(401).json({ message: 'Not authorize' });
    }

    await BoardActivity.deleteMany({ board: foundBoard._id });
    return res.status(200).json({ message: "activities removed" });
};

module.exports = {
    getBoardActivities,
    deleteAllBoardActivities
};
