import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Loading from "../ui/Loading";
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
    pointerWithin,
} from "@dnd-kit/core";
import { createPortal } from "react-dom";
import Icon from "../shared/Icon";
import useCurrentUserContext from "../../hooks/useCurrentUserContext";
import { axiosPrivate } from "../../api/axios";

const Pinned = ({
    boardId,
    title,
    handleOpenBoard,
    handleDeletePinnedBoard,
    isDeleting,
}) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: boardId,
        data: {
            boardId,
            title,
        },
    });

    const style = {
        transform: transform ? CSS.Translate.toString(transform) : undefined,
        transition,
        opacity: isDragging ? 0.2 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className={`${isDeleting ? "opacity-20 bg-red-200 line-through" : ""} touch-none flex items-center justify-between relative max-w-[300px] overflow-hidden whitespace-nowrap text-ellipsis top-left-auto board--style--sm bg-gray-100 text-[0.75rem] flex-1 border-[2px] border-gray-700 shadow-gray-700 p-3`}
            onClick={() => handleOpenBoard(boardId)}
        >
            <p>{title}</p>
            <button
                onClick={(e) => handleDeletePinnedBoard(e, boardId)}
                disabled={isDeleting}
                className="button--style--sm text-gray-400 hover:bg-red-300 hover:text-white p-1"
            >
                <Icon className="w-4 h-4" name="xmark" />
            </button>
        </div>
    );
};

const PinnedBoards = ({ setOpen }) => {
    const { currentUser, currentUserQuery } = useCurrentUserContext();

    const [pinnedBoards, setPinnedBoards] = useState([]);
    const [activeItem, setActiveItem] = useState(null);
    const [cleaned, setCleaned] = useState(false);
    const [loading, setLoading] = useState(false);
    const [deletingBoardId, setDeletingBoardId] = useState(null);

    const navigate = useNavigate();

    useEffect(() => {
        const idCollection = currentUser.pinnedBoardIdCollection;
        if (idCollection) {
            const entries = Object.entries(idCollection).map((entry, _) => {
                const [boardId, obj] = entry;
                return [boardId, obj.title];
            });

            setPinnedBoards(entries);
        }
    }, [currentUser?.pinnedBoardIdCollection]);

    const handleClose = () => {
        setOpen(false);
    };

    const handleOpenBoard = (boardId) => {
        setOpen(false);
        navigate(`/b/${boardId}`);
    };

    const handleDeletePinnedBoard = async (e, boardId) => {
        e.stopPropagation();
        try {
            setDeletingBoardId(boardId);

            await axiosPrivate.delete(`/boards/${boardId}/pinned`);
            await currentUserQuery.refetch();
        } catch (err) {
            console.log(err);
            alert("Failed to removed this board");
        } finally {
            setDeletingBoardId(null);
        }
    };

    const handleCleanPinnedBoards = async () => {
        if (cleaned) return;

        try {
            setLoading(true);
            await axiosPrivate.patch(`/boards/pinned/clean`);

            setLoading(false);
            setCleaned(true);
        } catch (err) {
            console.log(err);
            setLoading(false);
            alert("Failed to clean");
        }
    };

    const handleOnDragStart = (e) => {
        const { active } = e;
        setActiveItem(active);
    };

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

        try {
            const mappedPinnedBoards = [...pinnedBoards].reduce(
                (obj, board) => {
                    const [boardId, boardTitle] = board;
                    obj[boardId] ||= {};
                    obj[boardId]["title"] = boardTitle;
                    return obj;
                },
                {},
            );
            await axiosPrivate.patch(
                `/boards/pinned/update`,
                JSON.stringify({
                    pinnedBoards: mappedPinnedBoards,
                }),
            );
            await currentUserQuery.refetch();
        } catch (err) {
            console.log(err);
        }
    };

    const handleOnDragOver = (e) => {
        const { active, over } = e;
        if (!over) {
            return;
        }

        if (active.id === over.id) {
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

        if (overIndex === -1 || activeIndex === overIndex) {
            return;
        }

        const newPinnedBoards = [...pinnedBoards];
        const [removed] = newPinnedBoards.splice(activeIndex, 1);
        newPinnedBoards.splice(overIndex, 0, removed);
        setPinnedBoards(newPinnedBoards);
    };

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

    return (
        <>
            <div
                onClick={handleClose}
                className="select-none fixed box-border top-0 left-0 text-gray-600 font-bold h-[100vh] text-[1.25rem] w-full bg-gray-500 opacity-40 z-50 cursor-auto"
            ></div>

            <div className="fixed box--style flex flex-col gap-4 items-start p-3 top-1/2 right-1/2 left-[50%] -translate-x-[50%] -translate-y-1/2 w-fit min-w-[300px] max-h-[30rem] max-w-[400px] border-black border-[2px] z-50 cursor-auto bg-gray-200">
                <Loading
                    loading={loading}
                    position={"absolute"}
                    displayText={"loading..."}
                    fontSize={"0.75rem"}
                />

                <div className="flex w-full justify-between items-center border-b-[1px] border-black pb-3">
                    <div className="flex items-center gap-2">
                        <span className="font-normal text-gray-700">
                            pinned boards
                        </span>

                        {pinnedBoards.length > 0 && (
                            <button
                                onClick={handleCleanPinnedBoards}
                                className={`button--style--sm text-[0.75rem] px-1 underline hover:bg-pink-200 ${cleaned ? "text-blue-600" : "text-pink-600"}`}
                            >
                                clean
                            </button>
                        )}
                    </div>

                    <button
                        className="text-gray-600 flex justify-center items-center"
                        onClick={() => setOpen(false)}
                    >
                        <Icon className="w-4 h-4" name="xmark" />
                    </button>
                </div>

                <DndContext
                    collisionDetection={pointerWithin}
                    onDragStart={handleOnDragStart}
                    onDragOver={handleOnDragOver}
                    onDragEnd={handleOnDragEnd}
                    sensors={sensors}
                >
                    <div className="h-full w-full flex flex-col gap-3 pb-3 overflow-auto">
                        <SortableContext
                            items={pinnedBoards.map((_el, index) => index)}
                            strategy={verticalListSortingStrategy}
                        >
                            {pinnedBoards.map(([id, title], index) => (
                                <Pinned
                                    key={id}
                                    index={index}
                                    boardId={id}
                                    title={title}
                                    isDeleting={deletingBoardId === id}
                                    handleOpenBoard={handleOpenBoard}
                                    handleDeletePinnedBoard={
                                        handleDeletePinnedBoard
                                    }
                                />
                            ))}
                        </SortableContext>
                    </div>

                    {createPortal(
                        <DragOverlay>
                            {activeItem && (
                                <Pinned
                                    boardId={activeItem.id}
                                    title={activeItem.data.current.title}
                                    handleOpenBoard={handleOpenBoard}
                                    handleDeletePinnedBoard={
                                        handleDeletePinnedBoard
                                    }
                                />
                            )}
                        </DragOverlay>,
                        document.getElementById("root"),
                    )}
                </DndContext>
            </div>
        </>
    );
};

export default PinnedBoards;
