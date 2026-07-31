import List from '../models/List.js';
import { lexorank } from '../lib/lexorank.js';

/**
 * @param {{
 *   boardId: string;
 *   prevListId?: string;
 *   nextListId?: string;
 *   session: import("mongoose").mongo.ClientSession;
 * }} params
 * @returns {Promise<string>}
 * @throws {Error} If cannot generate order after rebalance
 */
async function generateListOrder({ boardId, prevListId, nextListId, session }) {
    const prev = prevListId
        ? await List.findById(prevListId).session(session)
        : null;
    const next = nextListId
        ? await List.findById(nextListId).session(session)
        : null;
    let [order, success] = lexorank.insert(prev?.order, next?.order);
    if (!success) {
        await rebalanceLists({ boardId, session });
        const freshPrev = prevListId
            ? await List.findById(prevListId).session(session)
            : null;
        const freshNext = nextListId
            ? await List.findById(nextListId).session(session)
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
 *   boardId: string;
 *   session: import("mongoose").mongo.ClientSession;
 * }} params
 */
async function rebalanceLists({ boardId, session }) {
    const lists = await List
        .find({ boardId })
        .sort({ order: 1 })
        .session(session);
    const ranks = lexorank.rebalance(lists.length);
    const ops = lists.map((list, i) => ({
        updateOne: {
            filter: { _id: list._id },
            update: { $set: { order: ranks[i] } },
        },
    }));
    if (ops.length) {
        await List.bulkWrite(ops, { session });
    }
}

export {
    generateListOrder,
    rebalanceLists,
}
