import { useEffect } from "react";

/**
 * @param {React.RefObject<HTMLElement | null>} ref
 * @param {() => void} handler
 */
const useClickOutside = (ref, handler) => {
    useEffect(() => {
        const listener = (/** @type {MouseEvent | TouchEvent} */ e) => {
            const target = /** @type {Node} */ (e.target);
            if (ref.current && !ref.current.contains(target)) {
                handler();
            }
        };

        window.addEventListener("mousedown", listener);
        window.addEventListener("touchstart", listener);

        return () => {
            window.removeEventListener("mousedown", listener);
            window.removeEventListener("touchstart", listener);
        };
    }, [ref, handler]);
};

export default useClickOutside;
