const List = require('../models/List.js');

/**
 * @param {string|import('mongoose').Types.ObjectId} id
 * @param {Object} [option={ lean: true }]
 * @param {boolean} [option.lean=true]
 */
const listById = (id, option = { lean: true }) => {
    const foundList = List.findById(id);
    if (option.lean) foundList.lean();
    return foundList;
};

const saveList = (listData) => {
    const newList = new List(listData);
    return newList.save();
};

module.exports = {
    listById,
    saveList,
}
