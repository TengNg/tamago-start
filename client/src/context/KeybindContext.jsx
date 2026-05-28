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

const getComboString = (e) => {
    const parts = [];

    if (e.ctrlKey) {
        parts.push("ctrl");
    }

    if (e.altKey) {
        parts.push("alt");
    }

    if (e.metaKey) {
        parts.push("meta");
    }

    parts.push(normalizeKey(e.key));

    return parts.join("+");
};

const KeybindContext = createContext(null);
export default KeybindContext;

export const KeybindProvider = ({ children }) => {
    const keybindsRef = useRef(new Map());

    const registerKeybind = useCallback((combo, handler, userOptions = {}) => {
        const normalized = normalizeCombo(combo);

        const options = {
            preventDefault: true,
            stopPropagation: false,
            ignoreInInputs: false,
            ...userOptions,
        };

        keybindsRef.current.set(normalized, { handler, options });

        return () => {
            keybindsRef.current.delete(normalized);
        };
    }, []);

    useEffect(() => {
        const handleKeyDown = (e) => {
            const combo = getComboString(e);
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

            entry.handler(e);
        };

        window.addEventListener("keydown", handleKeyDown, { passive: false });
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, []);

    return (
        <KeybindContext.Provider value={registerKeybind}>
            {children}
        </KeybindContext.Provider>
    );
};
