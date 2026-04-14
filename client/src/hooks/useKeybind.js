import { useContext, useEffect } from "react";
import KeybindContext from "../context/KeybindContext";

export const useKeybind = (combo, handler, options = {}) => {
    const register = useContext(KeybindContext);

    useEffect(() => {
        if (!register || !combo || !handler) {
            return;
        }

        const keybinds = Array.isArray(combo) ? combo : [combo];
        const unbinds = keybinds.map((c) => register(c, handler, options));
        return () => unbinds.forEach((fn) => fn());
    }, [combo, handler, options, register]);
};
