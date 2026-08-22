import { lexorank } from '../lib/lexorank.js';

/**
 * @typedef {{
 *   board: import("mongoose").Types.ObjectId;
 *   pinnedAt?: Date;
 *   order: string;
 * }} PinnedBoardEntry
 */

/**
 * @typedef {{
 *   pinnedBoards: PinnedBoardEntry[];
 *   markModified: (path: string) => void;
 * }} PinnedBoardHost
 */

/**
 * @param {{
 *   user: PinnedBoardHost;
 *   prevBoardId?: string | null;
 *   nextBoardId?: string | null;
 * }} params
 * @returns {string}
 * @throws {Error} If cannot generate order after rebalance
 */
function generatePinnedBoardOrder({ user, prevBoardId, nextBoardId }) {
    const prev = prevBoardId
        ? user.pinnedBoards.find((p) => p.board.equals(prevBoardId))
        : null;
    const next = nextBoardId
        ? user.pinnedBoards.find((p) => p.board.equals(nextBoardId))
        : null;

    let [order, success] = lexorank.insert(prev?.order, next?.order);
    if (!success) {
        rebalancePinnedBoards(user);

        const freshPrev = prevBoardId
            ? user.pinnedBoards.find((p) => p.board.equals(prevBoardId))
            : null;
        const freshNext = nextBoardId
            ? user.pinnedBoards.find((p) => p.board.equals(nextBoardId))
            : null;
        [order, success] = lexorank.insert(freshPrev?.order, freshNext?.order);
        if (!success) {
            throw new Error("Cannot generate order after rebalance");
        }
    }
    return order;
}

/**
 * @param {PinnedBoardHost} user
 */
function rebalancePinnedBoards(user) {
    const sorted = [...user.pinnedBoards].sort((a, b) =>
        a.order.localeCompare(b.order)
    );
    const ranks = lexorank.rebalance(sorted.length);
    sorted.forEach((entry, i) => {
        entry.order = ranks[i];
    });
    user.markModified("pinnedBoards");
}

export {
    generatePinnedBoardOrder,
    rebalancePinnedBoards,
};
