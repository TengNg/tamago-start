import Card from '../models/Card.js';

/**
 * @param {string|import('mongoose').Types.ObjectId} id
 * @param {Object} [option={ lean: true }]
 * @param {boolean} [option.lean=true]
 */
export const cardById = (id, option = { lean: true }) => {
    const foundCard = Card.findById(id);
    if (option.lean) foundCard.lean();
    return foundCard;
};
