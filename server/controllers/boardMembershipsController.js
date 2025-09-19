const Board = require("../models/Board");
const BoardMembership = require("../models/BoardMembership");

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const getBoardMemberships = async (req, res) => {
    const { boardId } = req.params;
    const foundBoard = await Board.findById(boardId);
    if (!foundBoard) return res.status(404).json({ msg: "board not found" });

    const memberships = await BoardMembership.find({ boardId }).lean();

    return res.json({ memberships });
};

module.exports = {
    getBoardMemberships
};

