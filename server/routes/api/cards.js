const express = require('express');
const router = express.Router();

const {
    getCard,
    addCard,
    updateTitle,
    updateDueDate,
    updateDescription,
    updateHighlight,
    updatePriorityLevel,
    deleteCard,
    reorder,
    copyCard,
    updateOwner,
    toggleVerified,
} = require('../../controllers/cardsController');

const { 
    getCardComments,
    getCardComment,
    createCardComment,
    deleteCardComment,
} = require('../../controllers/cardCommentsController');

let cardActionLocks = {};

const withLock = (action, fn) => async (req, res) => {
    const cardId = req.params.id;

     if (cardActionLocks[cardId] && cardActionLocks[cardId][action]) {
        res.status(503).send(`Service Unavailable: ${action}-action for list ${cardId} is being processed`);
        return;
    }

    // Acquire lock for the action
    if (!cardActionLocks[cardId]) {
        cardActionLocks[cardId] = {};
    }

    cardActionLocks[cardId][action] = true;

    try {
        // await new Promise(_ => setTimeout(_, 5000)); // for testing
        await fn(req, res);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Internal Server Error [Mutex]');
    } finally {
        // Release the lock after processing is complete
        delete cardActionLocks[cardId][action];
        if (Object.keys(cardActionLocks[cardId]).length === 0) {
            delete cardActionLocks[cardId];
        }
    }
};

router.route("/")
    .post(addCard)

router.route("/:id")
    .get(getCard)
    .delete(deleteCard)

router.route("/:id/reorder")
    .patch(reorder)

router.route("/:id/new-title")
    .patch(updateTitle)

router.route("/:id/new-description")
    .patch(updateDescription)

router.route("/:id/new-highlight")
    .patch(updateHighlight)

router.route("/:id/copy")
    .post(withLock("copy", copyCard))

router.route("/:id/member/update")
    .patch(updateOwner)

router.route("/:id/priority/update")
    .patch(updatePriorityLevel)

router.route("/:id/toggle-verified")
    .patch(withLock("toggleVerified", toggleVerified))

router.route("/:id/due-date/update")
    .patch(updateDueDate)

// Comments
router.route("/:cardId/comments")
    .get(getCardComments)
    .post(createCardComment)

router.route("/:cardId/comments/:commentId")
    .get(getCardComment)
    .delete(deleteCardComment)

module.exports = router;
