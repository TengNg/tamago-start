import express from 'express';
const router = express.Router();

import {
    getAllRequests,
    getBoardRequests,
    sendRequest,
    acceptRequest,
    rejectRequest,
    removeRequest,
} from "../../controllers/joinBoardRequestsController.js";

router.route("/")
    .get(getAllRequests)
    .post(sendRequest)

router.route("/:boardId")
    .get(getBoardRequests)

router.route("/:requestId")
    .delete(removeRequest)

router.route("/:requestId/accept")
    .patch(acceptRequest)

router.route("/:requestId/reject")
    .patch(rejectRequest)

export default router;
