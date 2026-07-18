/**
 * @param {unknown} err
 * @param {string} [fallback]
 * @returns {string}
 */
export function getErrorMessage(err, fallback = "Something went wrong") {
    if (err && typeof err === "object" && "status" in err && "data" in err) {
        const apiErr =
            /** @type {{ data?: { message?: string }; message?: string }} */ (
                err
            );
        return apiErr.data?.message ?? apiErr.message ?? fallback;
    }

    if (err instanceof Error) {
        return err.message;
    }

    if (typeof err === "string") {
        return err;
    }

    return fallback;
}
