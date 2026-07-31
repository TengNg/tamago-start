class Lexorank {
    constructor() {
        this.alphabet = "0123456789abcdefghijklmnopqrstuvwxyz";
        this.charToDigit = new Map([...this.alphabet].map((ch, idx) => [ch, idx]));
        this.MIN_DIGIT = 0;
        this.MAX_DIGIT = this.alphabet.length - 1;
        this.STEP_DIVISOR = 8;
    }

    /**
     * @param {string} [prev=""]
     * @param {string} [next=""]
     * @returns {[string, boolean]} [rank, success]
     */
    insert(prev = "", next = "") {
        prev = prev || "";
        next = next || "";
        if (prev && next) {
            if (prev === next) {
                return [prev, false];
            }
            if (prev > next) {
                return [prev, false];
            }
        }

        let rank = "";
        let i = 0;
        let boundedByNext = true;

        while (true) {
            const prevDigit = this.digitAt(prev, i, this.MIN_DIGIT);
            const nextIsReal = boundedByNext && i < next.length;
            const nextDigit = nextIsReal ? this.digitAt(next, i, this.MAX_DIGIT) : this.MAX_DIGIT;

            if (nextIsReal && prevDigit === nextDigit) {
                rank += this.alphabet[prevDigit];
                i++;
                continue;
            }

            let candidateDigit;
            if (nextIsReal) {
                candidateDigit = this.mid(prevDigit, nextDigit);
            } else {
                const remaining = this.MAX_DIGIT - prevDigit;
                candidateDigit = remaining <= 0
                    ? prevDigit
                    : prevDigit + Math.max(1, Math.ceil(remaining / this.STEP_DIVISOR));
            }

            if (candidateDigit === prevDigit) {
                rank += this.alphabet[prevDigit];
                i++;
                boundedByNext = false;
                continue;
            }

            rank += this.alphabet[candidateDigit];
            break;
        }

        if (next && rank >= next) {
            return [prev, false];
        }

        return [rank, true];
    }

    /**
     * @param {number} count
     * @returns {string[]}
     */
    rebalance(count) {
        if (!Number.isInteger(count) || count <= 0) {
            return [];
        }

        const base = this.alphabet.length;
        let length = 1;
        while (Math.pow(base, length) < count + 2) {
            length++;
        }

        const total = Math.pow(base, length);
        const step = total / (count + 1);

        const ranks = [];
        for (let i = 1; i <= count; i++) {
            ranks.push(this.toRank(Math.floor(step * i), length));
        }

        return ranks;
    }

    /**
     * @private
     * @param {number} prevDigit
     * @param {number} nextDigit
     */
    mid(prevDigit, nextDigit) {
        return Math.floor((prevDigit + nextDigit) / 2);
    }

    /**
     * @private
     * @param {string} str
     * @param {number} i
     * @param {number} fallback
     */
    digitAt(str, i, fallback) {
        if (i >= str.length) return fallback;
        const ch = str.charAt(i);
        const digit = this.charToDigit.get(ch);
        if (digit === undefined) {
            throw new Error(`Lexorank: "${ch}" is not in the configured alphabet ("${this.alphabet}")`);
        }
        return digit;
    }

    /**
     * @private
     * @param {number} value
     * @param {number} length
     */
    toRank(value, length) {
        const base = this.alphabet.length;
        let out = "";
        for (let i = 0; i < length; i++) {
            out = this.alphabet[value % base] + out;
            value = Math.floor(value / base);
        }
        return out;
    }
}

const lexorank = new Lexorank();
export { lexorank };
