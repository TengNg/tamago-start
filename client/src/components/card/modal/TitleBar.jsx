import React from "react";
import Icon from "../../shared/Icon";

export default function TitleBar({
    title,
    setTitle,
    card,
    cardTitleInput,
    confirmTitle,
    handleCancel,
    isScrolledDown,
}) {
    return (
        <div
            className="bg-[rgb(var(--card-item-bg))] sticky z-30 top-0 flex justify-start items-start p-3"
            style={{
                boxShadow: isScrolledDown
                    ? "0 2px 0 0 rgba(0, 0, 0, 0.25)"
                    : "none",
            }}
        >
            <div className="flex flex-col flex-1">
                <textarea
                    ref={cardTitleInput}
                    rows="1"
                    className="card__title__textarea font-medium text-gray-600 bg-transparent leading-normal resize-none"
                    value={title}
                    onKeyDown={(e) => {
                        if (e.key == "Enter") e.target.blur();
                    }}
                    onBlur={confirmTitle}
                    onFocus={(e) => {
                        e.target.style.height = "auto";
                        e.target.style.height = `${e.target.scrollHeight}px`;
                    }}
                    onChange={(e) => {
                        setTitle(e.target.value);
                        e.target.style.height = "auto";
                        e.target.style.height = `${e.target.scrollHeight}px`;
                    }}
                    maxLength={200}
                />
                {card.highlight && (
                    <div
                        className={`mt-2 h-2 w-40 md:w-60 bg-[${card.highlight}]`}
                        style={{ background: card.highlight }}
                    ></div>
                )}
            </div>
            <button
                onClick={handleCancel}
                className="text-[0.75rem] grid text-gray-400 hover:text-gray-600 place-items-center"
            >
                <Icon className="w-5 h-5" name="xmark" />
            </button>
        </div>
    );
}
