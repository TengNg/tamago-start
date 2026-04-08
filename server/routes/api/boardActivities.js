import express from 'express';
const router = express.Router();

import {
    getBoardActivities,
    deleteAllBoardActivities,
} from '../../controllers/boardActivitiesController.js';

router.route("/:boardId")
    .get(getBoardActivities)
    .delete(deleteAllBoardActivities)

export default router;
