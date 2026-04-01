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

/** @type {{ [cardId: string]: { [action: string]: true } | undefined }} */
let cardActionLocks = {};

/**
 * @param {string} action
 * @param {import("express").RequestHandler} fn
 */
const withCardLock = (action, fn) => {
    /**
     * @param {import("express").Request} req
     * @param {import("express").Response} res
     * @param {import("express").NextFunction} next
     */
    return async (req, res, next) => {
        const cardId = req.params.id;

        if (cardActionLocks[cardId]?.[action]) {
            const errMessage = process.env.NODE_ENV === "development"
                ? `withCardLock :: Service Unavailable: ${action}-action for card ${cardId} is being processed`
                : "Action is being processed"
            res.status(503).send(errMessage);
            return;
        }

        if (!cardActionLocks[cardId]) {
            cardActionLocks[cardId] = {};
        }

        cardActionLocks[cardId][action] = true;

        try {
            // await new Promise(_ => setTimeout(_, 2000));
            await fn(req, res, next);
        } catch (err) {
            next(err);
        } finally {
            delete cardActionLocks[cardId][action];
            if (Object.keys(cardActionLocks[cardId]).length === 0) {
                delete cardActionLocks[cardId];
            }
        }
    };
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
    .post(withCardLock("copy", copyCard))

router.route("/:id/member/update")
    .patch(updateOwner)

router.route("/:id/priority/update")
    .patch(updatePriorityLevel)

router.route("/:id/toggle-verified")
    .patch(withCardLock("toggleVerified", toggleVerified))

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
