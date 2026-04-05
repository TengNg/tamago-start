const Writedown = require("../models/Writedown");

const {
    saveNewWritedown,
    writedownsByUserId,
} = require('../services/writedownService');

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const getWritedowns = async (req, res) => {
    const { userId } = req.user;
    const writedowns = await writedownsByUserId(userId);
    return res.status(200).json({ writedowns });
};

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const getWritedown = async (req, res) => {
    const writedown = await Writedown.findOne({
        _id: req.params.writedownId,
        owner: req.user.userId
    });
    if (!writedown) {
        return res.sendStatus(404);
    }

    return res.status(200).json({ writedown });
};

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const createWritedown = async (req, res) => {
    const { userId } = req.user;
    const { rank } = req.body;
    const newWritedown = await saveNewWritedown({ owner: userId, order: rank });
    return res.status(200).json({ newWritedown });
};

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const saveWritedown = async (req, res) => {
    const writedown = await Writedown.findOne({
        _id: req.params.writedownId,
        owner: req.user.userId
    });
    if (!writedown) {
        return res.sendStatus(404);
    }

    const { content } = req.body;
    writedown.content = content;
    await writedown.save();

    const { _id, title, createdAt } = writedown;
    const updatedWritedown = { _id, title, content, createdAt }

    return res.status(200).json({ updatedWritedown });
};

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const pinWritedown = async (req, res) => {
    const writedown = await Writedown.findOne({
        _id: req.params.writedownId,
        owner: req.user.userId
    });
    if (!writedown) {
        return res.sendStatus(404);
    }

    writedown.pinned = !writedown.pinned;
    await writedown.save();
    return res.status(200).json({ pinned: writedown.pinned });
};

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const updateTitle = async (req, res) => {
    const writedown = await Writedown.findOne({
        _id: req.params.writedownId,
        owner: req.user.userId
    });
    if (!writedown) {
        return res.sendStatus(404);
    }

    const { title } = req.body;
    writedown.title = title;
    await writedown.save();
    return res.sendStatus(204);
};

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const deleteWritedown = async (req, res) => {
    const writedown = await Writedown.findOne({
        _id: req.params.writedownId,
        owner: req.user.userId
    });
    if (!writedown) {
        return res.sendStatus(404);
    }

    await Writedown.findByIdAndDelete(writedown._id);
    return res.sendStatus(204);
};

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const deleteAllWritedowns = async (req, res) => {
    await Writedown.deleteMany({ owner: req.user.userId });
    return res.sendStatus(204);
};

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const reorder = async (req, res) => {
    const writedown = await Writedown.findOne({
        _id: req.params.writedownId,
        owner: req.user.userId
    });
    if (!writedown) {
        return res.sendStatus(404);
    }

    const { rank } = req.body;
    await Writedown.findOneAndUpdate({ _id: writedown._id }, { order: rank });
    return res.sendStatus(204);
};

module.exports = {
    getWritedowns,
    getWritedown,
    createWritedown,
    saveWritedown,
    pinWritedown,
    updateTitle,
    deleteWritedown,
    deleteAllWritedowns,
    reorder,
};
