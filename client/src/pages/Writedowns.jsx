import { useState, useEffect, useMemo } from "react";
import Title from "../components/ui/Title";
import Editor from "../components/writedown/Editor";

import WritedownItem from "../components/writedown/WritedownItem";

import { useNavigate, useSearchParams } from "react-router-dom";
import { closestCenter, DndContext, DragOverlay } from "@dnd-kit/core";
import { rectSwappingStrategy, SortableContext } from "@dnd-kit/sortable";
import { createPortal } from "react-dom";
import { lexorank } from "../utils/class/Lexorank";
import { axiosPrivate } from "../api/axios";

const Writedown = () => {
    const [activeWritedown, setActiveWritedown] = useState(null);
    const [writedowns, setWritedowns] = useState([]);
    const [clonedWritedowns, setClonedWritedowns] = useState([]);
    const [writedown, setWritedown] = useState({
        open: false,
        loading: false,
        error: false,
        processingMsg: "",
        data: {},
    });
    const [isDataLoaded, setIsDataLoaded] = useState(false);
    const [isCreatingWritedown, setIsCreatingWritedown] = useState(false);

    const [searchParams, setSearchParams] = useSearchParams();

    useEffect(() => {
        fetchWritedowns();
    }, []);

    function handleFilterPinned() {
        if (searchParams.get("filter") === "pinned") {
            searchParams.delete("filter");
            setSearchParams(searchParams, { replace: true });
            return;
        }

        searchParams.set("filter", "pinned");
        setSearchParams(searchParams, { replace: true });
    }

    async function fetchWritedowns() {
        setIsDataLoaded(false);
        try {
            const response = await axiosPrivate.get("/personal_writedowns");
            setWritedowns(response.data.writedowns);
        } catch (err) {
            alert("Failed to get writedowns. Please try again.");
        } finally {
            setIsDataLoaded(true);
        }
    }

    async function handleOpenWritedown(id) {
        setWritedown((prev) => {
            return { ...prev, open: true, loading: true };
        });

        try {
            const response = await axiosPrivate.get(
                `/personal_writedowns/${id}`,
            );
            setWritedown({
                open: true,
                data: response.data.writedown,
                loading: false,
            });
        } catch (err) {
            setWritedown({
                open: false,
                error: true,
                loading: false,
            });

            alert("Can't load writedown");
        }
    }

    async function handleCreateWritedown() {
        setIsCreatingWritedown(true);

        if (isCreatingWritedown) return;

        try {
            const rank = lexorank.insert(
                writedowns[writedowns.length - 1]?.order,
                undefined,
            )[0];
            const response = await axiosPrivate.post(
                "/personal_writedowns",
                JSON.stringify({ rank }),
            );
            const { newWritedown } = response.data;
            setWritedowns((prev) => {
                return [...prev, newWritedown];
            });
        } catch (err) {
            alert("Failed to create writedown");
        } finally {
            setIsCreatingWritedown(false);
        }
    }

    async function handleSaveWritedown(id, value) {
        setWritedown((prev) => {
            return {
                ...prev,
                open: true,
                loading: true,
                processingMsg: "saving writedown...",
            };
        });

        try {
            const response = await axiosPrivate.put(
                `/personal_writedowns/${id}`,
                JSON.stringify({ content: value }),
            );

            const { updatedWritedown } = response.data;

            setWritedowns((prev) => {
                return prev.map((writedown) =>
                    writedown._id === updatedWritedown._id
                        ? updatedWritedown
                        : writedown,
                );
            });
        } catch (err) {
            console.log(err);
            alert("Failed to save writedown");
        } finally {
            setWritedown((prev) => {
                return { ...prev, loading: false, open: false };
            });
        }
    }

    async function handleDeleteWritedown(id, isEmpty) {
        if (
            !isEmpty &&
            !confirm("Are you sure you want to delete this writedown?")
        ) {
            return;
        }

        try {
            await axiosPrivate.delete(`/personal_writedowns/${id}`);
            setWritedowns((prev) => {
                return prev.filter((writedown) => writedown._id !== id);
            });
        } catch (err) {
            alert("Failed to delete writedown");
        }
    }

    async function handleDeleteAllWritedowns() {
        if (!confirm("Are you sure you want to delete all writedowns?")) return;

        try {
            await axiosPrivate.delete(`/personal_writedowns/`);
            setWritedowns([]);
        } catch (err) {
            alert("Failed to delete writedowns");
        }
    }

    async function handleUpdateWritedownTitle(id, newTitle) {
        try {
            await axiosPrivate.put(`/personal_writedowns/${id}/update-title`, {
                title: newTitle,
            });
        } catch (err) {
            console.log(err);
            alert("Failed to delete writedown");
        }
    }

    async function handlePinWritedown(id) {
        try {
            setWritedowns((prev) => {
                return prev.map((writedown) => {
                    return writedown._id === id
                        ? { ...writedown, isPinning: true }
                        : writedown;
                });
            });

            const response = await axiosPrivate.put(
                `/personal_writedowns/${id}/pin`,
            );

            setWritedowns((prev) => {
                const newWritedowns = prev.map((writedown) => {
                    if (writedown._id === id) {
                        return {
                            ...writedown,
                            pinned: response.data.pinned,
                            isPinning: false,
                        };
                    }

                    return writedown;
                });
                return newWritedowns;
            });
        } catch (err) {
            alert("Failed to pin writedown");
        }
    }

    async function handleOnDragEnd(e) {
        const { active, over } = e;

        if (!over || active.id == over.id) {
            return;
        }

        try {
            const items = [...writedowns];
            const oldIndex = items.findIndex((w) => w._id == active.id);
            const newIndex = items.findIndex((w) => w._id == over.id);
            if (oldIndex === newIndex) {
                return;
            }

            const [removed] = items.splice(oldIndex, 1);

            items.splice(newIndex, 0, removed);
            const prevRank = items[newIndex - 1]?.order;
            const nextRank = items[newIndex + 1]?.order;

            let [rank, ok] = lexorank.insert(prevRank, nextRank);
            if (!ok) {
                alert(
                    "invalid order, please try to drag this writedown to other position",
                );
                setClonedWritedowns(clonedWritedowns);
                return;
            }

            removed.order = rank;
            setWritedowns(items);

            await axiosPrivate.put(
                `/personal_writedowns/${removed._id}/reorder`,
                JSON.stringify({ rank }),
            );
        } catch (err) {
            alert("something went wrong, please try again");
            setClonedWritedowns(clonedWritedowns);
        } finally {
            setActiveWritedown(null);
        }
    }

    function handleOnDragStart(e) {
        const activeWd = e.active.data.current.writedown;
        setActiveWritedown(activeWd);
    }

    function handleOnDragCancel() {
        setActiveWritedown(null);
    }

    const writedownIds = useMemo(() => {
        return writedowns.map((w) => w._id);
    }, [writedowns]);

    return (
        <>
            <Editor
                writedown={writedown}
                setWritedown={setWritedown}
                saveWritedown={handleSaveWritedown}
                updateTitle={handleUpdateWritedownTitle}
            />

            <section className="w-full h-full overflow-auto pb-8">
                <div className="mx-auto sm:w-3/4 w-[90%]">
                    <Title titleName={"writedowns"} />

                    <div className="flex flex-col justify-center items-center gap-4 text-sm text-gray-600">
                        <button
                            onClick={handleCreateWritedown}
                            className="w-[180px] grid place-items-center text-gray-600 text-sm border-[2px] border-gray-600 border-dashed py-4 px-6 hover:bg-gray-600 hover:text-gray-50"
                        >
                            {isCreatingWritedown
                                ? "creating..."
                                : "+ new writedown"}
                        </button>
                    </div>

                    {!isDataLoaded ? (
                        <>
                            <div className="font-medium text-sm mx-auto text-center mt-10 text-gray-600">
                                getting writedowns
                            </div>

                            <div className="loader mx-auto mt-8"></div>
                        </>
                    ) : (
                        <>
                            {writedowns.length === 0 ? (
                                <div className="flex flex-col justify-center items-center gap-3 py-3 text-[11px] sm:text-sm text-center text-gray-700 mt-3">
                                    <p>
                                        this is your personal workspace
                                        <br />
                                        take notes or write down anything
                                        <br />
                                        create your first writedown
                                    </p>
                                </div>
                            ) : (
                                <div className="flex gap-4 items-center justify-center my-4">
                                    <div className="w-fit grid place-items-center">
                                        <button
                                            className="text-[0.75rem] text-gray-600 pe-1 text-center hover:underline cursor-pointer sm:mb-0 mb-1 mx-auto"
                                            onClick={fetchWritedowns}
                                        >
                                            refresh
                                        </button>
                                    </div>

                                    <div className="w-fit grid place-items-center">
                                        <button
                                            className={`${searchParams.has("filter") ? "text-amber-600" : "text-gray-600"} text-[0.75rem] pe-1 text-center hover:underline cursor-pointer sm:mb-0 mb-1 mx-auto`}
                                            onClick={handleFilterPinned}
                                        >
                                            pinned
                                        </button>
                                    </div>

                                    <div className="w-fit grid place-items-center">
                                        <button
                                            className="text-[0.75rem] text-gray-600 pe-1 text-center hover:underline hover:text-rose-800 cursor-pointer sm:mb-0 mb-1 mx-auto"
                                            onClick={handleDeleteAllWritedowns}
                                        >
                                            delete all
                                        </button>
                                    </div>
                                </div>
                            )}

                            <DndContext
                                collisionDetection={closestCenter}
                                onDragEnd={handleOnDragEnd}
                                onDragStart={handleOnDragStart}
                                onDragCancel={handleOnDragCancel}
                            >
                                <SortableContext
                                    strategy={rectSwappingStrategy}
                                    items={writedownIds}
                                >
                                    <div className="flex flex-wrap gap-4 justify-center items-center">
                                        {writedowns.map((w) => {
                                            return (
                                                <WritedownItem
                                                    key={w._id}
                                                    writedown={w}
                                                    open={handleOpenWritedown}
                                                    remove={
                                                        handleDeleteWritedown
                                                    }
                                                    pin={handlePinWritedown}
                                                />
                                            );
                                        })}
                                    </div>
                                </SortableContext>
                                {createPortal(
                                    <DragOverlay
                                        adjustScale
                                        style={{ transformOrigin: "0 0" }}
                                    >
                                        {activeWritedown && (
                                            <WritedownItem
                                                writedown={activeWritedown}
                                                open={handleOpenWritedown}
                                                remove={handleDeleteWritedown}
                                                pin={handlePinWritedown}
                                            />
                                        )}
                                    </DragOverlay>,
                                    document.getElementById("root"),
                                )}
                            </DndContext>
                        </>
                    )}
                </div>
            </section>
        </>
    );
};

export default Writedown;
