const express = require('express');
const router = express.Router();

const {
    addList,
    updateTitle,
    deleteList,
    copyList,
    reorder,
    moveList,
    getListCount,
} = require('../../controllers/listsController');

let listActionLocks = {};

const withLock = (action, fn) => async (req, res) => {
    const listId = req.params.id;

     if (listActionLocks[listId] && listActionLocks[listId][action]) {
        res.status(503).send(`Service Unavailable: ${action}-action for list ${listId} is being processed`);
        return;
    }

    // Acquire lock for the action
    if (!listActionLocks[listId]) {
        listActionLocks[listId] = {};
    }

    listActionLocks[listId][action] = true;

    try {
        // await new Promise(_ => setTimeout(_, 5000)); // for testing
        await fn(req, res);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Internal Server Error [Mutex]');
    } finally {
        // Release the lock after processing is complete
        delete listActionLocks[listId][action];
        if (Object.keys(listActionLocks[listId]).length === 0) {
            delete listActionLocks[listId];
        }
    }
};

router.route("/b/:boardId/count")
    .get(getListCount);

router.route("/")
    .post(addList)

router.route("/:id")
    .delete(deleteList);

router.route("/:id/reorder")
    .patch(reorder)

router.route("/:id/new-title")
    .patch(updateTitle)

router.route("/copy/:id")
    .post(withLock("copy", copyList))

router.route("/move/:id/b/:boardId/i/:index")
    .patch(moveList)

module.exports = router;
