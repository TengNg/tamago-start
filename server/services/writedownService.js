import Writedown from '../models/Writedown.js';

/**
 * @param {Object} writedownData
 * @param {string} writedownData.owner
 * @param {string} writedownData.order
 */
const saveNewWritedown = async (writedownData) => {
    const newWritedown = new Writedown(writedownData);
    return await newWritedown.save();
};

/**
 * @param {string} userId
 */
const writedownsByUserId = async (userId) => {
    const result = await Writedown
        .find({ owner: userId })
        .sort({ order: 'asc' })
        .lean();
    return result;
};

/**
 * @param {import('mongoose').Types.ObjectId | string} writedownId
 * @param {Object} [option={ lean: true }]
 * @param {boolean} [option.lean=true]
 */
const findWritedown = async (writedownId, option = { lean: true }) => {
    const foundWritedown = Writedown.findById(writedownId);
    if (option.lean) foundWritedown.lean();
    return foundWritedown;
};

export {
    saveNewWritedown,
    writedownsByUserId,
    findWritedown,
};
