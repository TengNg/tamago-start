import { useEffect, useState } from "react";

const useWindowSize = (delay = 200) => {
    const [windowSize, setWindowSize] = useState({
        width: window.innerWidth,
        height: window.innerHeight,
    });

    useEffect(() => {
        const debounce = (callback, delay) => {
            let timer = null;

            return function debouncedFunc() {
                clearTimeout(timer);
                timer = setTimeout(callback, delay);
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
