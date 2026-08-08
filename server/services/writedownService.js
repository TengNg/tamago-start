import Writedown from '../models/Writedown.js';
import { lexorank } from '../lib/lexorank.js';

/**
 * @param {{
 *   userId: string;
 *   prevId?: string;
 *   nextId?: string;
 *   session?: import("mongoose").mongo.ClientSession;
 * }} params
 * @returns {Promise<string>}
 * @throws {Error} If cannot generate order after rebalance
 */
async function generateWritedownOrder({ userId, prevId, nextId, session }) {
    const prev = prevId
        ? await Writedown.findOne({ _id: prevId, owner: userId }).session(session)
        : null;
    const next = nextId
        ? await Writedown.findOne({ _id: nextId, owner: userId }).session(session)
        : null;
    let [order, success] = lexorank.insert(prev?.order, next?.order);
    if (!success) {
        await rebalanceWritedowns({ userId, session });
        const freshPrev = prevId
            ? await Writedown.findOne({ _id: prevId, owner: userId }).session(session)
            : null;
        const freshNext = nextId
            ? await Writedown.findOne({ _id: nextId, owner: userId }).session(session)
            : null;
        [order, success] = lexorank.insert(freshPrev?.order, freshNext?.order);
        if (!success) {
            throw new Error("Cannot generate order after rebalance");
        }
    }
    return order;
}

/**
 * @param {{
 *   userId: string;
 *   session?: import("mongoose").mongo.ClientSession;
 * }} params
 */
async function rebalanceWritedowns({ userId, session }) {
    const writedowns = await Writedown
        .find({ owner: userId })
        .sort({ order: 1 })
        .session(session);
    const ranks = lexorank.rebalance(writedowns.length);
    const ops = writedowns.map((writedown, i) => ({
        updateOne: {
            filter: { _id: writedown._id },
            update: { $set: { order: ranks[i] } },
        },
    }));
    if (ops.length) {
        await Writedown.bulkWrite(ops, { session });
    }
}

export {
    generateWritedownOrder,
    rebalanceWritedowns,
}
