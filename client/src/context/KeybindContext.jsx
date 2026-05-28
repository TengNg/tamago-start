import { createContext, useRef, useCallback, useEffect } from "react";

const normalizeKey = (key) => {
    const lower = key.toLowerCase().trim();

    const map = {
        " ": "space",
        spacebar: "space",
        arrowup: "up",
        arrowdown: "down",
        arrowleft: "left",
        arrowright: "right",
        escape: "esc",
        // delete, backspace, tab, f1, etc.
    };

    return map[lower] ?? lower;
};

const normalizeCombo = (combo) => {
    if (!combo) {
        return "";
    }

    const rawParts = combo
        .toLowerCase()
        .split("+")
        .map((p) => p.trim())
        .filter(Boolean);

    if (rawParts.length === 0) {
        return "";
    }

    const keyPart = rawParts.pop();
    const normKey = normalizeKey(keyPart);

    const modOrder = ["ctrl", "alt", "meta"];
    const modSet = new Set(rawParts.filter((p) => modOrder.includes(p)));

    const sortedMods = modOrder.filter((m) => modSet.has(m));

    return [...sortedMods, normKey].join("+");
};

const getComboStr = (e) => {
    const parts = [];

    if (e.ctrlKey) parts.push("ctrl");
    if (e.altKey) parts.push("alt");
    if (e.metaKey) parts.push("meta");

    const key = normalizeKey(e.key);

    if (["ctrl", "alt", "meta"].includes(key)) {
        return "";
    }

    parts.push(key);

    return parts.join("+");
};

const KeybindContext = createContext(null);
export default KeybindContext;

export const KeybindProvider = ({ children }) => {
    const keybindsRef = useRef(new Map());

    /**
     * Registers a keyboard shortcut and binds it to a handler.
     *
     * @example
     * const unregister = registerKeybind("ctrl+k", () => moveFocus("up"), { ignoreInInputs: true });
     * unregister(); // later on unmount
     */
    const bind = useCallback(
        /**
         * @param {string} combo - Key combination to bind (e.g. `"ctrl+k"`, `"alt+shift+j"`)
         * @param {() => void} handler - Function to call when the combo is pressed
         * @param {object} [opts={}]
         * @param {boolean} [opts.preventDefault=true] - Call `e.preventDefault()` when the combo fires
         * @param {boolean} [opts.stopPropagation=false] - Call `e.stopPropagation()` when the combo fires
         * @param {boolean} [opts.ignoreInInputs=false] - Skip the handler when an input, textarea, select, or contenteditable element has focus
         * @param {string} [opts.desc] - Keybind's description
         * @returns {() => void} Cleanup function that unregisters the keybind. Call it on unmount
         */
        function (combo, handler, opts = {}) {
            const normalizedCombo = normalizeCombo(combo);

            keybindsRef.current.set(normalizedCombo, {
                handler,
                options: {
                    preventDefault: true,
                    stopPropagation: false,
                    ignoreInInputs: false,
                    ...opts,
                },
            });

            return () => {
                keybindsRef.current.delete(normalizedCombo);
            };
        },
        [],
    );

    const unbind = useCallback((combo) => {
        keybindsRef.current.delete(combo);
    }, []);

    const getKeybinds = useCallback(() => {
        return [...keybindsRef.current.entries()].map(
            ([combo, { options }]) => ({
                combo,
                options,
            }),
        );
    }, []);

    useEffect(() => {
        const handleKeyDown = (e) => {
            const combo = getComboStr(e);
            if (!combo) {
                return;
            }

            const entry = keybindsRef.current.get(combo);
            if (!entry) {
                return;
            }

            const target = e.target;
            const isInputFocused =
                target.tagName === "INPUT" ||
                target.tagName === "TEXTAREA" ||
                target.tagName === "SELECT" ||
                target.isContentEditable ||
                target.getAttribute("contenteditable") === "true";

            if (isInputFocused && entry.options.ignoreInInputs) {
                return;
            }

            if (entry.options.preventDefault) e.preventDefault();
            if (entry.options.stopPropagation) e.stopPropagation();

            entry.handler();
        };

        window.addEventListener("keydown", handleKeyDown, { passive: false });
        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, []);

    return (
        <KeybindContext.Provider
            value={{
                bind,
                unbind,
                getKeybinds,
            }}
        >
            {children}
        </KeybindContext.Provider>
    );
};
