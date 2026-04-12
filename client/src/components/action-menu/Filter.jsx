import { useEffect, useRef, useState, useMemo } from "react";
import useBoardState from "../../hooks/useBoardState";
import { useSearchParams } from "react-router-dom";

import { dateToCompare } from "../../utils/dateFormatter";
import PRIORITY_LEVELS from "../../data/priorityLevels";
import Icon from "../shared/Icon";
import useToast from "../../hooks/useToast";

const SEARCH_DEBOUNCE_MS = 300;

const Filter = ({ open, setOpen }) => {
    const { boardState, setBoardState, setHasFilter } = useBoardState();

    const [searchParams, setSearchParams] = useSearchParams();

    const dialog = useRef();
    const cardTitleInput = useRef();

    const [searchInputValue, setSearchInputValue] = useState(
        () => searchParams.get("search") || "",
    );
    const [debouncedSearchValue, setDebouncedSearchValue] = useState(
        () => searchParams.get("search") || "",
    );

    const toast = useToast();

    useEffect(() => {
        const id = setTimeout(() => {
            setDebouncedSearchValue(searchInputValue.trim());
        }, SEARCH_DEBOUNCE_MS);

        return () => {
            clearTimeout(id);
        };
    }, [searchInputValue]);

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

            return () => {
                dialog.current.removeEventListener("close", handleOnClose);
                dialog.current.removeEventListener("keydown", handleKeyDown);
            };
        } else {
            dialog.current.close();
        }
    }, [open]);

    useEffect(() => {
        if (
            debouncedSearchValue ||
            searchParams.get("priorities") ||
            searchParams.get("stale") ||
            searchParams.get("verified") ||
            searchParams.get("owners")
        ) {
            setHasFilter(true);
        } else {
            setHasFilter(false);
        }

        const searchValue = debouncedSearchValue;
        const prioritiesStr = searchParams.get("priorities");
        const priorities = prioritiesStr ? prioritiesStr.split(",") : [];
        const stale = searchParams.get("stale");
        const ownersStr = searchParams.get("owners");
        const owners = ownersStr
            ? ownersStr.split(",").map((o) => o.toLowerCase())
            : [];
        const verified = searchParams.get("verified");

        setBoardState((prev) => {
            return {
                ...prev,
                lists: prev.lists.map((list) => {
                    const newCards = [...list.cards].map((card) => {
                        let hiddenByFilter = true;

                        const isFilteredByTitle =
                            card.title
                                .toLowerCase()
                                .includes(searchValue?.toLowerCase() || "") ||
                            card._id
                                .toLowerCase()
                                .includes(searchValue?.toLowerCase() || "");

                        const isFilteredByPriority = priorities.includes(
                            card.priorityLevel,
                        );

                        const isFilteredByStale = dateToCompare(card.dueDate);

                        const lowerOwner = card.owner
                            ? card.owner.toLowerCase()
                            : null;
                        const isFilteredByOwner =
                            (owners.includes("unassigned") && !lowerOwner) ||
                            (lowerOwner && owners.includes(lowerOwner));

                        const isFilteredByVerified = card.verified;

                        const hasActiveFilter =
                            searchValue ||
                            priorities.length > 0 ||
                            stale === "true" ||
                            owners.length > 0 ||
                            verified === "true";

                        if (!hasActiveFilter) {
                            hiddenByFilter = false;
                        } else {
                            if (searchValue && isFilteredByTitle) {
                                hiddenByFilter = false;
                            }
                            if (priorities.length > 0 && isFilteredByPriority) {
                                hiddenByFilter = false;
                            }
                            if (stale === "true" && isFilteredByStale) {
                                hiddenByFilter = false;
                            }
                            if (owners.length > 0 && isFilteredByOwner) {
                                hiddenByFilter = false;
                            }
                            if (verified === "true" && isFilteredByVerified) {
                                hiddenByFilter = false;
                            }
                        }

                        return { ...card, hiddenByFilter };
                    });

                    return { ...list, cards: newCards };
                }),
            };
        });
    }, [searchParams, debouncedSearchValue]);

    const boardMembers = useMemo(() => {
        if (Object.keys(boardState).length === 0) {
            return {};
        }

        return boardState.members.reduce((acc, member) => {
            return { ...acc, [member.userId]: member.username };
        }, {});
    }, [boardState]);

    const handleCloseOnOutsideClick = (e) => {
        if (e.target === dialog.current) {
            dialog.current.close();
        }
    };

    const handleClose = () => {
        dialog.current.close();
    };

    const handleFilterByCardPriority = (value) => {
        let prioritiesStr = searchParams.get("priorities");
        let priorities = prioritiesStr ? prioritiesStr.split(",") : [];

        if (priorities.includes(value)) {
            priorities = priorities.filter((p) => p !== value);
        } else {
            priorities.push(value);
        }

        if (priorities.length === 0) {
            searchParams.delete("priorities");
        } else {
            searchParams.set("priorities", priorities.join(","));
        }

        setSearchParams(searchParams, { replace: true });
    };

    const handleFilterByStaleStatus = () => {
        if (searchParams.get("stale") === "true") {
            searchParams.delete("stale");
        } else {
            searchParams.set("stale", "true");
        }
        setSearchParams(searchParams, { replace: true });
    };

    const handleFilterByOwner = (value) => {
        let ownersStr = searchParams.get("owners");
        let owners = ownersStr ? ownersStr.split(",") : [];

        const lowerValue = value.toLowerCase();
        if (owners.includes(lowerValue)) {
            owners = owners.filter((o) => o !== lowerValue);
        } else {
            owners.push(lowerValue);
        }

        if (owners.length === 0) {
            searchParams.delete("owners");
        } else {
            searchParams.set("owners", owners.join(","));
        }

        setSearchParams(searchParams, { replace: true });
    };

    const handleFilterByVerified = () => {
        if (searchParams.get("verified") === "true") {
            searchParams.delete("verified");
        } else {
            searchParams.set("verified", "true");
        }
        setSearchParams(searchParams, { replace: true });
    };

    const handleCopyFilterLink = async () => {
        const params = new URLSearchParams(searchParams);
        if (debouncedSearchValue.trim()) {
            params.set("search", debouncedSearchValue.trim());
        } else {
            params.delete("search");
        }

        const origin = window.location.origin;
        const pathname = window.location.pathname;
        const filterUrl = `${origin}${pathname}${params.toString()}`;
        try {
            await navigator.clipboard.writeText(filterUrl);
            toast.success("Link copied");
        } catch (err) {
            toast.error("Failed to copy filter link:", err);
        }
    };

    const currentPriorities = searchParams.get("priorities")?.split(",") || [];
    const currentOwners = searchParams.get("owners")?.split(",") || [];
    const hasFilter =
        debouncedSearchValue ||
        searchParams.get("priorities") ||
        searchParams.get("stale") ||
        searchParams.get("owners") ||
        searchParams.get("verified");

    return (
        <dialog
            ref={dialog}
            className="z-40 backdrop:bg-black/15 box--style gap-4 items-start p-3 min-w-[350px] h-fit border-black border-2 bg-gray-200"
            onClick={handleCloseOnOutsideClick}
        >
            <div className="flex w-full justify-between items-center border-b border-black pb-3">
                <div className="flex gap-2">
                    <p className="font-normal text-[1rem] text-gray-700">
                        filter
                    </p>
                    {hasFilter && (
                        <button
                            onClick={handleCopyFilterLink}
                            title="copy filter link"
                        >
                            <Icon
                                name="link"
                                className="w-4 h-4 text-gray-600 hover:text-gray-800"
                            />
                        </button>
                    )}
                </div>
                <div onClick={handleClose}>
                    <Icon
                        name="xmark"
                        className="w-4 h-4 cursor-pointer text-gray-600 flex justify-center items-center"
                    />
                </div>
            </div>

            <form onSubmit={(e) => e.preventDefault()}>
                <div className="w-full relative flex flex-col items-start gap-4 py-2 mt-2">
                    <div className="w-full flex gap-2">
                        <input
                            ref={cardTitleInput}
                            className={`p-3 w-full overflow-hidden shadow-[0_3px_0_0] shadow-gray-600 text-sm whitespace-nowrap text-ellipsis border-2 bg-gray-100 border-gray-600 text-gray-600 font-medium select-none focus:outline-hidden`}
                            placeholder="card title"
                            value={searchInputValue}
                            onChange={(e) =>
                                setSearchInputValue(e.target.value)
                            }
                        />
                    </div>

                    <div className="h-px bg-gray-700 w-full"></div>

                    <div className="w-full flex gap-2 flex-wrap">
                        <div
                            className="select-none flex items-center gap-1 text-[0.75rem] cursor-pointer w-fit p-1 px-2 text-gray-700 font-medium hover:brightness-105 border border-gray-700"
                            onClick={() => handleFilterByOwner("unassigned")}
                            style={{
                                textDecoration: currentOwners.includes(
                                    "unassigned",
                                )
                                    ? "underline"
                                    : "none",
                            }}
                        >
                            <Icon
                                name="xmark"
                                className="text-gray-700 w-3.5 h-3.5"
                            />
                            unassigned
                        </div>

                        {Object.entries(boardMembers).map((m) => {
                            const [id, username] = m;
                            return (
                                <div
                                    key={id}
                                    className="select-none flex items-center gap-1 text-[0.75rem] cursor-pointer w-fit p-1 px-2 text-gray-700 font-medium hover:brightness-105 border border-gray-700"
                                    onClick={() =>
                                        handleFilterByOwner(username)
                                    }
                                    style={{
                                        textDecoration: currentOwners.includes(
                                            username.toLowerCase(),
                                        )
                                            ? "underline"
                                            : "none",
                                    }}
                                >
                                    <Icon
                                        name="profile"
                                        className="text-gray-700 w-3.5 h-3.5"
                                    />
                                    {username}
                                </div>
                            );
                        })}
                    </div>

                    <div className="h-px bg-gray-700 w-full"></div>

                    <div className="w-full flex flex-col gap-2">
                        {Object.values(PRIORITY_LEVELS).map((item) => {
                            const { title, value, color } = item;
                            return (
                                <div
                                    key={title}
                                    className="text-[0.75rem] cursor-pointer w-full p-1 px-3 text-gray-50 font-medium uppercase hover:brightness-105"
                                    onClick={() =>
                                        handleFilterByCardPriority(value)
                                    }
                                    style={{
                                        backgroundColor: color,
                                        textDecoration:
                                            currentPriorities.includes(value)
                                                ? "underline"
                                                : "none",
                                    }}
                                >
                                    {title}
                                </div>
                            );
                        })}
                    </div>

                    <div className="h-px bg-black w-full"></div>

                    <div
                        className="text-[0.75rem] cursor-pointer w-full py-1 px-3 text-green-800 font-medium bg-green-100 border-2 border-green-800 hover:brightness-105"
                        style={{
                            textDecoration:
                                searchParams.get("verified") === "true"
                                    ? "underline"
                                    : "none",
                        }}
                        onClick={handleFilterByVerified}
                    >
                        VERIFIED
                    </div>

                    <div className="h-px bg-black w-full"></div>

                    <div
                        className="text-[0.75rem] cursor-pointer w-full py-1 px-3 text-pink-800 font-medium bg-pink-100 border-2 border-pink-800 hover:brightness-105"
                        style={{
                            textDecoration:
                                searchParams.get("stale") === "true"
                                    ? "underline"
                                    : "none",
                        }}
                        onClick={handleFilterByStaleStatus}
                    >
                        STALE
                    </div>

                    {hasFilter && (
                        <>
                            <div className="h-px bg-black w-full"></div>
                            <button
                                type="button"
                                className="hover:bg-gray-200 mx-auto w-full button--style border-2 py-2 text-[0.75rem] shadow-[0_3px_0_0] shadow-gray-600 bg-gray-100"
                                onClick={() => {
                                    setSearchInputValue("");
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
