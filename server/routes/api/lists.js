import express from 'express';
const router = express.Router();

import {
    addList,
    updateList,
    deleteList,
    copyList,
    reorder,
    moveList,
} from '../../controllers/listsController.js';

router.route("/")
    .post(addList)

router.route("/:id")
    .patch(updateList)

router.route("/:id")
    .delete(deleteList);

router.route("/:id/reorder")
    .patch(reorder)

router.route("/copy/:id")
    .post(copyList)

router.route("/move/:id/b/:boardId/i/:index")
    .patch(moveList)

export default router;
