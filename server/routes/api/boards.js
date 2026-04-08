import express from 'express';
const router = express.Router();

import {
    getBoards,
    getBoardStats,
    createBoard,
    getBoard,
    updateVisibility,
    updateTitle,
    updateDescription,
    leaveBoard,
    removeMemberFromBoard,
    closeBoard,
    copyBoard,
    getListCount,
} from '../../controllers/boardsController.js';

router.route("/")
    .get(getBoards)
    .post(createBoard)

router.route("/:id")
    .get(getBoard)
    .delete(closeBoard)

router.route("/:id/stats")
    .get(getBoardStats)

router.route("/:id/list-count")
    .get(getListCount)

router.route("/:id/members/leave")
    .delete(leaveBoard)

router.route("/:id/members/:memberName")
    .delete(removeMemberFromBoard)

router.route("/:id/new-title")
    .patch(updateTitle)

router.route("/:id/new-description")
    .patch(updateDescription)

router.route("/:id/new-visibility")
    .patch(updateVisibility)

router.route("/copy/:id")
    .post(copyBoard)

export default router;
