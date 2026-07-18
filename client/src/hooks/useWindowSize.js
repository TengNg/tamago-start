import { useEffect, useState } from "react";

/**
 * @typedef {Object} WindowSize
 * @property {number} width
 * @property {number} height
 */

/**
 * @param {number} [delay=200]
 * @returns {WindowSize}
 */
const useWindowSize = (delay = 200) => {
    const [windowSize, setWindowSize] = useState(
        /** @type {WindowSize} */ ({
            width: window.innerWidth,
            height: window.innerHeight,
        }),
    );

    useEffect(() => {
        /**
         * @template {(...args: any[]) => void} T
         * @param {T} callback
         * @param {number} delay
         * @returns {(...args: Parameters<T>) => void}
         */
        const debounce = (callback, delay) => {
            /** @type {ReturnType<typeof setTimeout> | null} */
            let timer = null;

            return function debouncedFunc(...args) {
                if (timer) {
                    clearTimeout(timer);
                }

                timer = setTimeout(() => callback(...args), delay);
            };
        };

        const handleResize = debounce(() => {
            setWindowSize({
                width: window.innerWidth,
                height: window.innerHeight,
            });
        }, delay);

        window.addEventListener("resize", handleResize);

        return () => {
            window.removeEventListener("resize", handleResize);
        };
    }, [delay]);

    return windowSize;
};

export default useWindowSize;
