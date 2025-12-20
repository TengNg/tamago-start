const Writedown = require('../models/Writedown');

/**
 * @param {string|import('mongoose').Types.ObjectId} writedownId
 */
const isActionAuthorized = async (writedownId) => {
    const foundWritedown = await findWritedown(writedownId, { lean: false });
    if (!foundWritedown) {
        return { authorized: false, error: 'writedown not found' }
    }

    return {
        authorized: true,
        writedown: foundWritedown
    }
};

/**
 * @param {Object} writedownData
 * @param {string|import('mongoose').Types.ObjectId} writedownData.owner
 * @param {string} writedownData.order
 */
const saveNewWritedown = async (writedownData) => {
    const newWritedown = new Writedown(writedownData);
    return await newWritedown.save();
};

/**
 * @param {string|import('mongoose').Types.ObjectId} userId
 */
const writedownsByUserId = async (userId) => {
    const result = await Writedown
        .find({ owner: userId })
        .sort({ order: 'asc' })
        .lean();
    return result;
};

/**
 * @param {string|import('mongoose').Types.ObjectId} writedownId
 * @param {Object} [option={ lean: true }]
 * @param {boolean} [option.lean=true]
 */
const findWritedown = async (writedownId, option = { lean: true }) => {
    const foundWritedown = Writedown.findById(writedownId);
    if (option.lean) foundWritedown.lean();
    return foundWritedown;
};

const handleAuthorizationAndGetWritedown = async (req, res) => {
    const { writedownId } = req.params;
    const {
        authorized,
        error,
        writedown,
    } = await isActionAuthorized(writedownId);
    if (!authorized) {
        return res.status(403).json({ msg: error || "unauthorized" });
    }
    return res.status(200).json({ writedown });
};

module.exports = {
    saveNewWritedown,
    writedownsByUserId,
    findWritedown,
    isActionAuthorized,
    handleAuthorizationAndGetWritedown,
};
