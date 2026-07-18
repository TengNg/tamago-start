import { useContext, useEffect } from "react";
import KeybindContext from "../context/KeybindContext";

/**
 * @param {string | string[]} combo
 * @param {() => void} handler
 * @param {KeybindOptions} [options={}]
 */
export const useKeybind = (combo, handler, options = {}) => {
    const { bind } = useContext(KeybindContext);

    useEffect(() => {
        if (!bind || !combo || !handler) {
            return;
        }

        const keybinds = Array.isArray(combo) ? combo : [combo];
        const unbinds = keybinds.map((c) => bind(c, handler, options));
        return () => {
            unbinds.forEach((fn) => fn());
        };
    }, [combo, handler, options, bind]);
};
