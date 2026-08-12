import { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
    SortableContext,
    useSortable,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
    DndContext,
    DragOverlay,
    PointerSensor,
    TouchSensor,
    useSensor,
    useSensors,
    closestCorners,
} from "@dnd-kit/core";
import { createPortal } from "react-dom";
import Icon from "../shared/Icon";
import useToast from "../../hooks/useToast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { meApi } from "../../services/api";
import useAuth from "../../hooks/useAuth";
import { getErrorMessage } from "../../utils/getErrorMessage";

/**
 * @param {{ boardId: string; title: string }} props
 */
const Pinned = ({ boardId, title }) => {
    const queryClient = useQueryClient();

    const toast = useToast();

    const { attributes, listeners, setNodeRef, transform, isDragging } =
        useSortable({
            id: boardId,
            data: {
                boardId,
                title,
            },
        });

    /** @type {React.CSSProperties} */
    const style = {
        transform: transform ? CSS.Translate.toString(transform) : undefined,
        opacity: isDragging ? 0.2 : 1,
    };

    const location = useLocation();

    const navigate = useNavigate();

    const parts = location.pathname.split("/");
    const isInCurrentBoard = parts[1] === "b" && parts[2] === boardId;

    const deleteMutation = useMutation({
        mutationFn: async () => meApi.deletePinnedBoard(boardId),
        onSuccess: (data) => {
            queryClient.setQueryData(
                ["me"],
                /** @param {{ user: CurrentUser } | undefined} old */
                (old) => {
                    if (!old?.user) return old;
                    return {
                        ...old,
                        user: {
                            ...old.user,
                            pinnedBoardIdCollection: data.pinnedBoards,
                        },
                    };
                },
            );
        },
        onError: (err) => {
            const errMsg = getErrorMessage(
                err,
                "Failed to delete pinned board",
            );
            toast.error(errMsg);
        },
    });

    const navigateToBoard = () => {
        if (!deleteMutation.isPending) {
            navigate(`/b/${boardId}`);
        }
    };

    /** @param {React.MouseEvent<HTMLButtonElement>} e */
    const deleteBoard = (e) => {
        e.stopPropagation();
        deleteMutation.mutate();
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className={`${isInCurrentBoard ? "underline" : ""} ${deleteMutation.isPending ? "opacity-20 bg-red-200 line-through" : "bg-gray-200 hover:bg-gray-100"} select-none touch-none flex items-center justify-between relative overflow-hidden whitespace-nowrap text-ellipsis top-left-auto text-[0.75rem] flex-1 border-2 border-b-5 border-gray-700 shadow-gray-700 p-3 cursor-pointer`}
            onClick={navigateToBoard}
        >
            <p>{title}</p>
            <button
                onClick={deleteBoard}
                disabled={deleteMutation.isPending}
                className="text-gray-400 hover:bg-rose-500 hover:text-white p-1 grid place-items-center"
            >
                <Icon className="w-3 h-3" name="xmark" />
            </button>
        </div>
    );
};

const PinnedBoards = () => {
    const queryClient = useQueryClient();

    const { currentUser } = useAuth();

    const [pinnedBoards, setPinnedBoards] = useState(
        /** @type {string[][]} */ ([]),
    );
    const [activeItem, setActiveItem] = useState(
        /** @type {import('@dnd-kit/core').Active | null} */ (null),
    );

    const toast = useToast();

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 10,
            },
        }),
        useSensor(TouchSensor, {
            activationConstraint: {
                distance: 10,
            },
        }),
    );

    useEffect(() => {
        const idCollection = currentUser?.pinnedBoardIdCollection;
        if (idCollection) {
            const entries = Object.entries(idCollection).map((entry, _) => {
                const [boardId, obj] = entry;
                return [boardId, obj.title];
            });

            setPinnedBoards(entries);
        }
    }, [currentUser?.pinnedBoardIdCollection]);

    const cleanMutation = useMutation({
        mutationFn: meApi.cleanPinnedBoards,
        onSuccess: () => {
            queryClient.setQueryData(
                ["me"],
                /** @param {{ user: CurrentUser } | undefined} old */
                (old) => {
                    if (!old?.user) return old;
                    return {
                        ...old,
                        user: {
                            ...old.user,
                            pinnedBoardIdCollection: {},
                        },
                    };
                },
            );
        },
        onError: (err) => {
            const errMsg = getErrorMessage(
                err,
                "Failed to clean pinned boards",
            );
            toast.error(errMsg);
        },
    });

    /** @param {import('@dnd-kit/core').DragStartEvent} e */
    const handleOnDragStart = (e) => {
        const { active } = e;
        setActiveItem(active);
    };

    /** @param {import('@dnd-kit/core').DragEndEvent} e */
    const handleOnDragEnd = async (e) => {
        setActiveItem(null);

        const { active, over } = e;
        if (!over) {
            return;
        }

        const activeIndex = pinnedBoards.findIndex((item) => {
            const [id, _title] = item;
            return id === active.id;
        });

        const overIndex = pinnedBoards.findIndex((item) => {
            const [id, _title] = item;
            return id === over.id;
        });

        if (activeIndex === overIndex) {
            return;
        }

        const prevOrder = [...pinnedBoards];

        try {
            const newPinnedBoards = [...pinnedBoards];
            const [removed] = newPinnedBoards.splice(activeIndex, 1);
            newPinnedBoards.splice(overIndex, 0, removed);
            setPinnedBoards(newPinnedBoards);

            const mappedPinnedBoards = [...newPinnedBoards].reduce(
                (obj, board) => {
                    const [boardId, boardTitle] = board;
                    obj[boardId] ||= { title: boardTitle };
                    return obj;
                },
                /** @type {Record<string, { title: string }>} */ ({}),
            );

            const data = await meApi.updatePinnedBoards(mappedPinnedBoards);
            queryClient.setQueryData(
                ["me"],
                /** @param {{ user: CurrentUser } | undefined} old */
                (old) => {
                    if (!old?.user) return old;
                    return {
                        ...old,
                        user: {
                            ...old.user,
                            pinnedBoardIdCollection: data.pinnedBoards,
                        },
                    };
                },
            );
        } catch (err) {
            setPinnedBoards(prevOrder);
            const errMsg = getErrorMessage(
                err,
                "Failed to update pinned boards",
            );
            toast.error(errMsg);
        }
    };

    const boardIds = useMemo(() => {
        return pinnedBoards.map(([boardId, _title]) => boardId);
    }, [pinnedBoards]);

    return (
        <div className="w-full relative">
            <DndContext
                collisionDetection={closestCorners}
                onDragStart={handleOnDragStart}
                onDragEnd={handleOnDragEnd}
                sensors={sensors}
            >
                <div className="h-full w-full flex flex-col gap-2 overflow-auto">
                    <SortableContext
                        items={boardIds}
                        strategy={verticalListSortingStrategy}
                    >
                        {pinnedBoards.map(([id, title]) => (
                            <Pinned key={id} boardId={id} title={title} />
                        ))}
                    </SortableContext>
                </div>

                {createPortal(
                    <DragOverlay>
                        {activeItem && (
                            <Pinned
                                boardId={/** @type {string} */ (activeItem.id)}
                                title={activeItem.data.current?.title || ""}
                            />
                        )}
                    </DragOverlay>,
                    /** @type {HTMLElement} */ (
                        document.getElementById("root")
                    ),
                )}
            </DndContext>

            {pinnedBoards.length > 1 && (
                <button
                    onClick={() => cleanMutation.mutate()}
                    className="me-auto text-[10px] badge border-red-600 border border-b-3 text-red-600 bg-red-100 cursor-pointer mt-3 px-3"
                >
                    delete all
                </button>
            )}
        </div>
    );
};

export default PinnedBoards;
