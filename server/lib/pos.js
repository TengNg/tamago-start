/**
 * Float positioning system.
 *
 * Uses double-precision floats (64-bit) for item ordering.
 * Positions are stored as numbers and sorted numerically.
 *
 * Algorithm:
 * - First item: initialPosition (e.g. 2^47 for cards)
 * - Append to end: last.pos + step (e.g. 2^14)
 * - Insert at start: first.pos / 2
 * - Insert between: (prev.pos + next.pos) / 2
 * - Rebalance when positions get too close
 */

const STEP = 2 ** 14; // 16384

const PRESETS = {
    card:      { initial: 2 ** 47, step: STEP },
    list:      { initial: 2 ** 14, step: STEP },
    writedown: { initial: 2 ** 14, step: STEP },
};

const MIN_DISTANCE = 1;

class Pos {
    /**
     * @param {object} opts
     * @param {number} opts.initial - starting position for first item
     * @param {number} opts.step - gap when appending to end
     * @param {number} [opts.minDistance] - threshold for rebalance check
     */
    constructor(opts) {
        this.initial = opts.initial;
        this.step = opts.step;
        this.minDistance = opts.minDistance ?? MIN_DISTANCE;
    }

    first() {
        return this.initial;
    }

    /**
     * @param {number} lastPos
     */
    afterLast(lastPos) {
        return lastPos == null ? this.first() : lastPos + this.step;
    }

    /**
     * @param {number} firstPos
     */
    beforeFirst(firstPos) {
        return firstPos == null ? this.first() : firstPos / 2;
    }

    /**
     * @param {number} prevPos
     * @param {number} nextPos
     */
    between(prevPos, nextPos) {
        if (prevPos == null && nextPos == null) return this.first();
        if (prevPos == null) return this.beforeFirst(nextPos);
        if (nextPos == null) return this.afterLast(prevPos);
        return (prevPos + nextPos) / 2;
    }

    /**
     * Compute new position when reordering by index.
     * @param {Array<{order: number}>} items - sorted by current order
     * @param {number} fromIndex - current index of moved item
     * @param {number} toIndex - destination index
     */
    reorder(items, fromIndex, toIndex) {
        const rest = items.filter((_, i) => i !== fromIndex);
        const prevPos = toIndex > 0 ? rest[toIndex - 1]?.order ?? null : null;
        const nextPos = toIndex < rest.length ? rest[toIndex]?.order ?? null : null;
        return this.between(prevPos, nextPos);
    }

    /**
     * Check if two positions are too close.
     * @param {number} posA
     * @param {number} posB
     */
    tooClose(posA, posB) {
        return Math.abs(posA - posB) < this.minDistance;
    }

    /**
     * @param {Array<{order: number}>} items
     * @param {object} [opts]
     * @param {number} [opts.start]
     * @param {number} [opts.step]
     * @returns {Array<{index: number, order: number}>}
     */
    rebalance(items, opts = {}) {
        const start = opts.start ?? this.initial;
        const step = opts.step ?? this.step;
        return items.map((_, i) => ({ index: i, order: start + step * i }));
    }

    /**
     * @param {number[]} sortedPositions
     * @param {number} pos
     * @returns {number}
     */
    findIndex(sortedPositions, pos) {
        let lo = 0;
        let hi = sortedPositions.length;
        while (lo < hi) {
            const mid = (lo + hi) >>> 1;
            if (sortedPositions[mid] < pos) lo = mid + 1;
            else hi = mid;
        }
        return lo;
    }
}

const cardPos = new Pos(PRESETS.card);
const listPos = new Pos(PRESETS.list);
const writedownPos = new Pos(PRESETS.writedown);

export { cardPos, listPos, writedownPos };
