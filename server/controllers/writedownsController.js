import mongoose from 'mongoose';
import Writedown from "../models/Writedown.js";
import Attachment from "../models/Attachment.js";
import { generateWritedownOrder } from '../services/writedownService.js';

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const getWritedowns = async (req, res) => {
    const { userId } = req.user;
    const writedowns = await Writedown.find({ owner: userId }).sort({ order: 'asc' }).lean();
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
    }).lean();
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
    const { prevId, nextId } = req.body;

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const order = await generateWritedownOrder({ userId, prevId, nextId, session });
        const [newWritedown] = await Writedown.create([{ owner: userId, order }], { session });

        await session.commitTransaction();

        res.status(201).json(newWritedown);
    } catch (err) {
        await session.abortTransaction();
        throw err;
    } finally {
        session.endSession();
    }
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

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        await Attachment.deleteMany({ docModel: "Writedown", doc: writedown._id }, { session });
        await Writedown.findByIdAndDelete(writedown._id).session(session);

        await session.commitTransaction();

        return res.sendStatus(204);
    } catch (err) {
        await session.abortTransaction();
        throw err;
    } finally {
        session.endSession();
    }
};

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const deleteAllWritedowns = async (req, res) => {
    const writedownIds = await Writedown.find({ owner: req.user.userId }).distinct('_id');
    if (writedownIds.length === 0) {
        return res.sendStatus(204);
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        await Attachment.deleteMany({ docModel: 'Writedown', doc: { $in: writedownIds } }, { session });
        await Writedown.deleteMany({ _id: { $in: writedownIds } }, { session });

        await session.commitTransaction();

        return res.sendStatus(204);
    } catch (err) {
        await session.abortTransaction();
        throw err;
    } finally {
        session.endSession();
    }
};

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const reorder = async (req, res) => {
    const { userId } = req.user;
    const { prevId, nextId } = req.body;

    const writedown = await Writedown.findOne({
        _id: req.params.writedownId,
        owner: userId
    });
    if (!writedown) {
        return res.sendStatus(404);
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const order = await generateWritedownOrder({ userId, prevId, nextId, session });
        await Writedown.findOneAndUpdate({ _id: writedown._id }, { order }).session(session);

        await session.commitTransaction();

        res.sendStatus(204);
    } catch (err) {
        await session.abortTransaction();
        throw err;
    } finally {
        session.endSession();
    }
};

export {
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
