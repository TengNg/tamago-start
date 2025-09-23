import { useEffect, useRef } from "react";
import useBoardState from "../../hooks/useBoardState";
import { useSearchParams } from "react-router-dom";

import { dateToCompare } from "../../utils/dateFormatter";
import PRIORITY_LEVELS from "../../data/priorityLevels";
import Icon from "../shared/Icon";

const Filter = ({ open, setOpen }) => {
    const { setBoardState, setHasFilter } = useBoardState();

    const [searchParams, setSearchParams] = useSearchParams();

    const dialog = useRef();
    const cardTitleInput = useRef();

    useEffect(() => {
        if (
            searchParams.get("filter") ||
            searchParams.get("priority") ||
            searchParams.get("stale")
        ) {
            setHasFilter(true);
        } else {
            setHasFilter(false);
        }
    }, [searchParams]);

    useEffect(() => {
        if (open) {
            dialog.current.showModal();
            cardTitleInput.current.focus();

            const handleKeyDown = (e) => {
                if (e.ctrlKey && e.key === "/") {
                    e.preventDefault();
                    cardTitleInput.current.focus();
                }
            };

            const handleOnClose = () => {
                setOpen(false);
            };

            dialog.current.addEventListener("close", handleOnClose);
            dialog.current.addEventListener("keydown", handleKeyDown);

            () => {
                dialog.current.removeEventListener("close", handleOnClose);
                dialog.current.removeEventListener("keydown", handleKeyDown);
            };
        } else {
            dialog.current.close();
        }
    }, [open]);

    useEffect(() => {
        const searchValue = searchParams.get("filter");
        const priorityValue = searchParams.get("priority");
        const stale = searchParams.get("stale");

        setBoardState((prev) => {
            return {
                ...prev,
                lists: prev.lists.map((list) => {
                    const newCards = [...list.cards].map((card) => {
                        if (!searchValue && !priorityValue && !stale)
                            return { ...card, hiddenByFilter: false };

                        const isFilteredByTitle =
                            card.title
                                .toLowerCase()
                                .includes(searchValue?.toLowerCase()) ||
                            card._id
                                .toLowerCase()
                                .includes(searchValue?.toLowerCase());
                        const isFilteredByPriority =
                            card.priorityLevel === priorityValue;
                        const isFilteredByStale = dateToCompare(card.dueDate);

                        let hiddenByFilter = true;

                        if (searchValue && isFilteredByTitle) {
                            hiddenByFilter = false;
                        }

                        if (priorityValue && isFilteredByPriority) {
                            hiddenByFilter = false;
                        }

                        if (stale && isFilteredByStale) {
                            hiddenByFilter = false;
                        }

                        return { ...card, hiddenByFilter };
                    });
                    return { ...list, cards: newCards };
                }),
            };
        });
    }, [searchParams]);

    const handleCloseOnOutsideClick = (e) => {
        if (e.target === dialog.current) {
            dialog.current.close();
        }
    };

    const handleClose = () => {
        dialog.current.close();
    };

    const handleFilterByCardTitle = (e) => {
        e.preventDefault();

        const searchValue = cardTitleInput.current.value.trim();
        if (!searchValue) {
            if (searchParams.has("filter")) {
                searchParams.delete("filter");
                setSearchParams(searchParams, { replace: true });
                return;
            }
        }

        searchParams.set("filter", searchValue);
        setSearchParams(searchParams, { replace: true });
    };

    return (
        <dialog
            ref={dialog}
            className="z-40 backdrop:bg-black/15 box--style gap-4 items-start p-3 h-fit min-w-[350px] max-h-[500px] border-black border-[2px] bg-gray-200"
            onClick={handleCloseOnOutsideClick}
        >
            <div className="flex w-full justify-between items-center border-b-[1px] border-black pb-3">
                <p className="font-normal text-[1rem] text-gray-700">filter</p>
                <div onClick={handleClose}>
                    <Icon
                        name="xmark"
                        className="w-4 h-4 cursor-pointer text-gray-600 flex justify-center items-center"
                    />
                </div>
            </div>

            <form onSubmit={handleFilterByCardTitle}>
                <div className="w-full relative flex flex-col items-start gap-4 py-2 mt-2">
                    <div className="w-full flex gap-2">
                        <input
                            ref={cardTitleInput}
                            className={`p-3 w-full overflow-hidden shadow-[0_3px_0_0] shadow-gray-600 sm:text-[0.75rem] whitespace-nowrap text-ellipsis border-[2px] bg-gray-100 border-gray-600 text-gray-600 font-bold select-none font-mono focus:outline-none`}
                            placeholder="search for cards..."
                        />
                    </div>

                    <div className="h-[1px] bg-gray-700 w-full"></div>

                    <div className="w-full flex flex-col gap-2">
                        {Object.values(PRIORITY_LEVELS).map((item) => {
                            const { title, value, color } = item;
                            return (
                                <div
                                    key={title}
                                    className="text-[0.75rem] cursor-pointer w-full p-1 px-3 text-gray-50 font-medium uppercase hover:brightness-105"
                                    onClick={() => {
                                        searchParams.set("priority", value);
                                        setSearchParams(searchParams, {
                                            replace: true,
                                        });
                                    }}
                                    style={{
                                        backgroundColor: color.rgba,
                                        textDecoration:
                                            searchParams.get("priority") ===
                                            value
                                                ? "underline"
                                                : "none",
                                    }}
                                >
                                    {title}
                                </div>
                            );
                        })}
                    </div>

                    <div className="h-[1px] bg-black w-full"></div>

                    <div
                        className="text-[0.75rem] cursor-pointer w-full py-1 px-3 text-pink-800 font-medium bg-pink-100 border-[2px] border-pink-800 hover:brightness-105"
                        style={{
                            textDecoration:
                                searchParams.get("stale") === "true"
                                    ? "underline"
                                    : "none",
                        }}
                        onClick={() => {
                            searchParams.set("stale", true);
                            setSearchParams(searchParams, { replace: true });
                        }}
                    >
                        Stale Cards
                    </div>

                    {(searchParams.get("filter") ||
                        searchParams.get("priority") ||
                        searchParams.get("stale")) && (
                        <>
                            <div className="h-[1px] bg-black w-full"></div>
                            <button
                                type="button"
                                className="mx-auto w-full button--style border-[2px] py-2 text-[0.75rem] transition-all shadow-[0_3px_0_0] shadow-gray-600 bg-gray-100"
                                onClick={() => {
                                    setSearchParams({}, { replace: true });
                                }}
                            >
                                clear filter
                            </button>
                        </>
                    )}
                </div>
            </form>
        </dialog>
    );
};

export default Filter;
