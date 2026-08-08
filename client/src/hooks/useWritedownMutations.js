import { useMutation, useQueryClient } from "@tanstack/react-query";
import { writedownApi } from "../services/api";
import useToast from "./useToast";
import { getErrorMessage } from "../utils/getErrorMessage";
import { writedownKeys } from "../queries/writedownKeys";

const useWritedownMutations = () => {
    const queryClient = useQueryClient();
    const toast = useToast();

    const createMutation = useMutation({
        mutationFn: async (
            /** @type {{ prevId: string | null, nextId: string | null }} */
            { prevId, nextId },
        ) => {
            return writedownApi.createWritedown(prevId, nextId);
        },
        onSuccess: (data) => {
            queryClient.setQueryData(
                writedownKeys.all(),
                (
                    /** @type {{ writedowns: Writedown[] } | undefined} */ old,
                ) => {
                    return {
                        writedowns: [...(old?.writedowns ?? []), data],
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
            return writedownApi.saveWritedown(id, content);
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
        mutationFn: (/** @type {string} */ id) =>
            writedownApi.deleteWritedown(id),
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
        mutationFn: () => writedownApi.deleteAllWritedowns(),
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

            return writedownApi.pinWritedown(id);
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
            return writedownApi.updateWritedownTitle(id, title);
        },
        onError: (err) => {
            toast.error(getErrorMessage(err, "Failed to update title"));
        },
    });

    const reorderMutation = useMutation({
        mutationFn: async (
            /** @type {{ id: string, prevId: string | null, nextId: string | null }} */
            { id, prevId, nextId },
        ) => {
            await writedownApi.reorderWritedown(id, prevId, nextId);
        },
        onError: (err) => {
            toast.error(
                getErrorMessage(err, "something went wrong, please try again"),
            );
            queryClient.invalidateQueries({ queryKey: writedownKeys.all() });
        },
    });

    return {
        createWritedown: (
            /** @type {string | null} */ prevId,
            /** @type {string | null} */ nextId,
        ) => createMutation.mutateAsync({ prevId, nextId }),
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
            /** @type {string | null} */ prevId,
            /** @type {string | null} */ nextId,
        ) => reorderMutation.mutateAsync({ id, prevId, nextId }),
        isCreating: createMutation.isPending,
        isSaving: saveMutation.isPending,
    };
};

export default useWritedownMutations;
