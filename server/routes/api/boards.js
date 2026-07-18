import express from 'express';
const router = express.Router();

import {
    getBoards,
    getBoardStats,
    createBoard,
    getBoard,
    updateBoard,
    leaveBoard,
    removeMemberFromBoard,
    closeBoard,
    copyBoard,
    getListCount,
} from '../../controllers/boardsController.js';

import {
    getBoardActivities,
    deleteAllBoardActivities,
} from '../../controllers/boardActivitiesController.js';

router.route("/")
    .get(getBoards)
    .post(createBoard)

router.route("/:id")
    .get(getBoard)
    .delete(closeBoard)

router.route("/:id/activities")
    .get(getBoardActivities)
    .delete(deleteAllBoardActivities)

router.route("/:id/stats")
    .get(getBoardStats)

router.route("/:id/list-count")
    .get(getListCount)

router.route("/:id/members/leave")
    .delete(leaveBoard)

router.route("/:id/members/:memberId")
    .delete(removeMemberFromBoard)

router.route("/:id")
    .patch(updateBoard)

router.route("/copy/:id")
    .post(copyBoard)

export default router;
