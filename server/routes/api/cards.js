import express from 'express';
const router = express.Router();

import {
    getCard,
    addCard,
    updateCard,
    deleteCard,
    reorder,
    copyCard,
} from '../../controllers/cardsController.js';

import {
    getCardComments,
    getCardComment,
    createCardComment,
    deleteCardComment,
} from '../../controllers/cardCommentsController.js';

router.route("/")
    .post(addCard)

router.route("/:id")
    .get(getCard)
    .patch(updateCard)
    .delete(deleteCard)

router.route("/:id/reorder")
    .patch(reorder)

router.route("/:id/copy")
    .post(copyCard)

// Comments
router.route("/:cardId/comments")
    .get(getCardComments)
    .post(createCardComment)

router.route("/:cardId/comments/:commentId")
    .get(getCardComment)
    .delete(deleteCardComment)

export default router;
