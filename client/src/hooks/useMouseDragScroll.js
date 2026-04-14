import { useEffect, useCallback, useRef } from "react";

export const useMouseDragScroll = () => {
    const elRef = useRef(null);

    const refCallback = useCallback((node) => {
        elRef.current = node;
    }, []);

    const handleMouseDown = useCallback((e) => {
        const el = elRef.current;
        if (!el) return;

        if (
            e.target !== el &&
            !e.target.classList.contains("list__item__wrapper")
        ) {
            return;
        }

        const startPos = {
            left: el.scrollLeft,
            top: el.scrollTop,
            x: e.clientX,
            y: e.clientY,
        };

        const handleMouseMove = (e) => {
            const dx = e.clientX - startPos.x;
            const dy = e.clientY - startPos.y;
            el.scrollTop = startPos.top - dy;
            el.scrollLeft = startPos.left - dx;
        };

        const handleMouseUp = () => {
            document.removeEventListener("mousemove", handleMouseMove);
            document.removeEventListener("mouseup", handleMouseUp);
        };

        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseup", handleMouseUp);
    }, []);

    useEffect(() => {
        const el = elRef.current;
        if (!el) return;

        el.addEventListener("mousedown", handleMouseDown);

        return () => {
            el.removeEventListener("mousedown", handleMouseDown);
        };
    }, [handleMouseDown]);

    return { ref: refCallback, scrollEl: elRef };
};
