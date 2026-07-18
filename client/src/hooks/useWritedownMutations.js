import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
    createWritedown,
    saveWritedown,
    deleteWritedown,
    deleteAllWritedowns,
    pinWritedown,
    updateWritedownTitle,
    reorderWritedown,
} from "../api/writedownApi";
import useToast from "./useToast";
import { getErrorMessage } from "../utils/getErrorMessage";
import { writedownKeys } from "../queries/writedownKeys";
import { lexorank } from "../lib/lexorank";

const useWritedownMutations = () => {
    const queryClient = useQueryClient();
    const toast = useToast();

    const createMutation = useMutation({
        mutationFn: async (/** @type {string} */ rank) => {
            return createWritedown(rank);
        },
        onSuccess: (data) => {
            queryClient.setQueryData(
                writedownKeys.all(),
                (
                    /** @type {{ writedowns: Writedown[] } | undefined} */ old,
                ) => {
                    return {
                        writedowns: [
                            ...(old?.writedowns ?? []),
                            data.newWritedown,
                        ],
                    };
                },
            );
        },
        onError: (err) => {
            toast.error(getErrorMessage(err, "Failed to create writedown"));
        },
    });

    const saveMutation = useMutation({
        mutationFn: async (
            /** @type {{ id: string, content: string }} */
            { id, content },
        ) => {
            return saveWritedown(id, content);
        },
        onSuccess: (data) => {
            queryClient.setQueryData(
                writedownKeys.all(),
                (
                    /** @type {{ writedowns: Writedown[] } | undefined} */ old,
                ) => {
                    if (!old) return old;
                    return {
                        ...old,
                        writedowns: old.writedowns.map((w) =>
                            w._id === data.updatedWritedown._id
                                ? { ...w, ...data.updatedWritedown }
                                : w,
                        ),
                    };
                },
            );
        },
        onError: (err) => {
            toast.error(getErrorMessage(err, "Failed to save writedown"));
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (/** @type {string} */ id) => deleteWritedown(id),
        onSuccess: (_data, /** @type {string} */ id) => {
            queryClient.setQueryData(
                writedownKeys.all(),
                (
                    /** @type {{ writedowns: Writedown[] } | undefined} */ old,
                ) => {
                    if (!old) return old;
                    return {
                        ...old,
                        writedowns: old.writedowns.filter((w) => w._id !== id),
                    };
                },
            );
        },
        onError: (err) => {
            toast.error(getErrorMessage(err, "Failed to delete writedown"));
        },
    });

    const deleteAllMutation = useMutation({
        mutationFn: () => deleteAllWritedowns(),
        onSuccess: () => {
            queryClient.setQueryData(writedownKeys.all(), {
                writedowns: [],
            });
        },
        onError: (err) => {
            toast.error(getErrorMessage(err, "Failed to delete writedowns"));
        },
    });

    const pinMutation = useMutation({
        mutationFn: async (/** @type {string} */ id) => {
            queryClient.setQueryData(
                writedownKeys.all(),
                (
                    /** @type {{ writedowns: Writedown[] } | undefined} */ old,
                ) => {
                    if (!old) return old;
                    return {
                        ...old,
                        writedowns: old.writedowns.map((w) =>
                            w._id === id ? { ...w, isPinning: true } : w,
                        ),
                    };
                },
            );

            return pinWritedown(id);
        },
        onSuccess: (data, /** @type {string} */ id) => {
            queryClient.setQueryData(
                writedownKeys.all(),
                (
                    /** @type {{ writedowns: Writedown[] } | undefined} */ old,
                ) => {
                    if (!old) return old;
                    return {
                        ...old,
                        writedowns: old.writedowns.map((w) =>
                            w._id === id
                                ? {
                                      ...w,
                                      pinned: data.pinned,
                                      isPinning: false,
                                  }
                                : w,
                        ),
                    };
                },
            );
        },
        onError: (err) => {
            toast.error(getErrorMessage(err, "Failed to pin writedown"));
            queryClient.invalidateQueries({ queryKey: writedownKeys.all() });
        },
    });

    const updateTitleMutation = useMutation({
        mutationFn: async (
            /** @type {{ id: string, title: string }} */
            { id, title },
        ) => {
            return updateWritedownTitle(id, title);
        },
        onError: (err) => {
            toast.error(getErrorMessage(err, "Failed to update title"));
        },
    });

    const reorderMutation = useMutation({
        mutationFn: async (
            /** @type {{ id: string, oldIndex: number, newIndex: number }} */
            { id, oldIndex, newIndex },
        ) => {
            const cached =
                /** @type {{ writedowns: Writedown[] } | undefined} */ (
                    queryClient.getQueryData(writedownKeys.all())
                );
            if (!cached) return;

            /** @type {Writedown[]} */
            const items = [...cached.writedowns];
            const [removed] = items.splice(oldIndex, 1);
            items.splice(newIndex, 0, removed);

            const prevRank = items[newIndex - 1]?.order;
            const nextRank = items[newIndex + 1]?.order;
            const [rank, ok] = lexorank.insert(prevRank, nextRank);

            if (!ok) {
                throw new Error(
                    "Invalid order, please try dragging to another position",
                );
            }

            removed.order = rank;
            queryClient.setQueryData(writedownKeys.all(), {
                writedowns: items,
            });

            await reorderWritedown(id, rank);
        },
        onError: (err) => {
            toast.error(
                getErrorMessage(err, "something went wrong, please try again"),
            );
            queryClient.invalidateQueries({ queryKey: writedownKeys.all() });
        },
    });

    return {
        createWritedown: (/** @type {string} */ rank) =>
            createMutation.mutateAsync(rank),
        saveWritedown: (
            /** @type {string} */ id,
            /** @type {string} */ content,
        ) => saveMutation.mutateAsync({ id, content }),
        deleteWritedown: (/** @type {string} */ id) =>
            deleteMutation.mutateAsync(id),
        deleteAllWritedowns: () => deleteAllMutation.mutateAsync(),
        pinWritedown: (/** @type {string} */ id) => pinMutation.mutateAsync(id),
        updateWritedownTitle: (
            /** @type {string} */ id,
            /** @type {string} */ title,
        ) => updateTitleMutation.mutateAsync({ id, title }),
        reorderWritedown: (
            /** @type {string} */ id,
            /** @type {number} */ oldIndex,
            /** @type {number} */ newIndex,
        ) => reorderMutation.mutateAsync({ id, oldIndex, newIndex }),
        isCreating: createMutation.isPending,
        isSaving: saveMutation.isPending,
    };
};

export default useWritedownMutations;
