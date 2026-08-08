import { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Title from "../components/ui/Title";
import Editor from "../components/writedown/Editor";
import WritedownItem from "../components/writedown/WritedownItem";
import { useSearchParams } from "react-router-dom";
import { closestCenter, DndContext, DragOverlay } from "@dnd-kit/core";
import { rectSwappingStrategy, SortableContext } from "@dnd-kit/sortable";
import { createPortal } from "react-dom";
import useWritedownMutations from "../hooks/useWritedownMutations";
import { writedownApi } from "../services/api";
import { writedownKeys } from "../queries/writedownKeys";

const Writedowns = () => {
    const [activeWritedown, setActiveWritedown] = useState(
        /** @type {Writedown | null} */ (null),
    );
    const [editor, setEditor] = useState({
        open: false,
        writedownId: /** @type {string | null} */ (null),
    });

    const [searchParams, setSearchParams] = useSearchParams();
    const queryClient = useQueryClient();

    const {
        createWritedown,
        deleteWritedown,
        deleteAllWritedowns,
        reorderWritedown,
        pinWritedown,
        isCreating,
    } = useWritedownMutations();

    const { data, isLoading } = useQuery({
        queryKey: writedownKeys.all(),
        queryFn: () => writedownApi.fetchWritedowns(),
    });

    const writedowns = useMemo(() => {
        const all = data?.writedowns ?? [];
        return searchParams.get("filter") === "pinned"
            ? all.filter((w) => w.pinned)
            : all;
    }, [data?.writedowns, searchParams]);

    function handleFilterPinned() {
        if (searchParams.get("filter") === "pinned") {
            searchParams.delete("filter");
            setSearchParams(searchParams, { replace: true });
            return;
        }

        searchParams.set("filter", "pinned");
        setSearchParams(searchParams, { replace: true });
    }

    /** @param {string} id */
    function handleOpenWritedown(id) {
        setEditor({ open: true, writedownId: id });
    }

    function handleCloseEditor() {
        setEditor({ open: false, writedownId: null });
    }

    async function handleCreateWritedown() {
        if (isCreating) return;

        const prevId = writedowns[writedowns.length - 1]?._id ?? null;

        await createWritedown(prevId, null);
    }

    /**
     * @param {string} id
     * @param {boolean} isEmpty
     */
    async function handleDeleteWritedown(id, isEmpty) {
        if (
            !isEmpty &&
            !confirm("Are you sure you want to delete this writedown?")
        ) {
            return;
        }

        await deleteWritedown(id);
    }

    async function handleDeleteAllWritedowns() {
        if (!confirm("Are you sure you want to delete all writedowns?")) return;

        await deleteAllWritedowns();
    }

    /** @param {string} id */
    async function handlePinWritedown(id) {
        await pinWritedown(id);
    }

    /**
     * @param {import("@dnd-kit/core").DragEndEvent} e
     */
    async function handleOnDragEnd(e) {
        setActiveWritedown(null);

        const { active, over } = e;

        if (!over || active.id === over.id) {
            return;
        }

        const activeId = /** @type {string} */ (active.id);
        const overId = /** @type {string} */ (over.id);

        const cached = /** @type {{ writedowns: Writedown[] } | undefined} */ (
            queryClient.getQueryData(writedownKeys.all())
        );
        if (!cached) {
            return;
        }

        const oldIndex = cached.writedowns.findIndex((w) => w._id == activeId);
        const newIndex = cached.writedowns.findIndex((w) => w._id == overId);

        if (oldIndex === newIndex) {
            return;
        }

        const items = [...cached.writedowns];
        const [moved] = items.splice(oldIndex, 1);
        items.splice(newIndex, 0, moved);

        const prevId = items[newIndex - 1]?._id ?? null;
        const nextId = items[newIndex + 1]?._id ?? null;

        queryClient.setQueryData(writedownKeys.all(), { writedowns: items });

        await reorderWritedown(activeId, prevId, nextId);
    }

    /**
     * @param {import("@dnd-kit/core").DragStartEvent} e
     */
    function handleOnDragStart(e) {
        const activeWd = e.active.data.current?.writedown;
        setActiveWritedown(activeWd ?? null);
    }

    function handleOnDragCancel() {
        setActiveWritedown(null);
    }

    const writedownIds = useMemo(() => {
        return writedowns.map((w) => w._id);
    }, [writedowns]);

    const rootEl = document.getElementById("root") ?? document.body;

    return (
        <>
            <Editor
                writedownId={editor.writedownId}
                open={editor.open}
                onClose={handleCloseEditor}
            />

            <section className="w-full h-full overflow-auto pb-8">
                <div className="mx-auto sm:w-3/4 w-[90%]">
                    <Title titleName={"writedowns"} />

                    <div className="flex flex-col justify-center items-center gap-4 text-sm text-gray-600">
                        <button
                            onClick={handleCreateWritedown}
                            className="w-45 grid place-items-center text-gray-600 text-sm border-2 border-gray-600 border-dashed py-4 px-6 hover:bg-gray-600 hover:text-gray-50"
                        >
                            {isCreating ? "creating..." : "+ new writedown"}
                        </button>
                    </div>

                    {isLoading ? (
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
                                            onClick={() => {
                                                queryClient.invalidateQueries({
                                                    queryKey:
                                                        writedownKeys.all(),
                                                });
                                            }}
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
                                    rootEl,
                                )}
                            </DndContext>
                        </>
                    )}
                </div>
            </section>
        </>
    );
};

export default Writedowns;
