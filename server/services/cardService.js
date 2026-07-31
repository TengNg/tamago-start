import Card from '../models/Card.js';
import { lexorank } from '../lib/lexorank.js';

/**
 * @param {{
 *   listId: string;
 *   prevCardId?: string;
 *   nextCardId?: string;
 *   session: import("mongoose").mongo.ClientSession;
 * }} params
 * @returns {Promise<string>}
 * @throws {Error} If cannot generate order after rebalance
 */
async function generateCardOrder({ listId, prevCardId, nextCardId, session }) {
    const prev = prevCardId
        ? await Card.findById(prevCardId).session(session)
        : null;
    const next = nextCardId
        ? await Card.findById(nextCardId).session(session)
        : null;
    let [order, success] = lexorank.insert(prev?.order, next?.order);
    if (!success) {
        await rebalanceCards({ listId, session });
        const freshPrev = prevCardId
            ? await Card.findById(prevCardId).session(session)
            : null;
        const freshNext = nextCardId
            ? await Card.findById(nextCardId).session(session)
            : null;
        [order, success] = lexorank.insert(freshPrev?.order, freshNext?.order);
        if (!success) {
            throw new Error("Cannot generate order after rebalance");
        }
    }
    return order;
};

/**
 * @param {{
 *   listId: string
 *   session: import("mongoose").mongo.ClientSession;
 * }} params
 */
async function rebalanceCards({ listId, session }) {
    const cards = await Card
        .find({ listId })
        .sort({ order: 1 })
        .session(session);
    const ranks = lexorank.rebalance(cards.length);
    const ops = cards.map((card, i) => ({
        updateOne: {
            filter: { _id: card._id },
            update: { $set: { order: ranks[i] } },
        },
    }));
    if (ops.length) {
        await Card.bulkWrite(ops, { session });
    }
}

export {
    generateCardOrder,
    rebalanceCards,
}
