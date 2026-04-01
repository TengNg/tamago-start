const express = require('express');
const router = express.Router();

const {
    addList,
    updateTitle,
    deleteList,
    copyList,
    reorder,
    moveList,
} = require('../../controllers/listsController');

/** @type {{ [listId: string]: { [action: string]: true } | undefined }} */
let listActionLocks = {};

/**
 * @param {string} action
 * @param {import("express").RequestHandler} fn
 */
const withListLock = (action, fn) => {
    /**
     * @param {import("express").Request} req
     * @param {import("express").Response} res
     * @param {import("express").NextFunction} next
     */
    return async (req, res, next) => {
        const listId = req.params.id;

        if (listActionLocks[listId]?.[action]) {
            const errMessage = process.env.NODE_ENV === "development"
                ? `withListLock :: Service Unavailable: ${action}-action for list ${listId} is being processed`
                : "Action is being processed"
            res.status(503).send(errMessage);
            return;
        }

        if (!listActionLocks[listId]) {
            listActionLocks[listId] = {};
        }

        listActionLocks[listId][action] = true;

        try {
            // await new Promise(_ => setTimeout(_, 2000));
            await fn(req, res, next);
        } catch (err) {
            next(err);
        } finally {
            delete listActionLocks[listId][action];
            if (Object.keys(listActionLocks[listId]).length === 0) {
                delete listActionLocks[listId];
            }
        }
    };
};

router.route("/")
    .post(addList)

router.route("/:id")
    .delete(deleteList);

router.route("/:id/reorder")
    .patch(reorder)

router.route("/:id/new-title")
    .patch(updateTitle)

router.route("/copy/:id")
    .post(withListLock("copy", copyList))

router.route("/move/:id/b/:boardId/i/:index")
    .patch(moveList)

module.exports = router;
