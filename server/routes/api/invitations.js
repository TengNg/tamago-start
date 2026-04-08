import express from 'express';
const router = express.Router();

import {
    getInvitations,
    sendInvitation,
    acceptInvitation,
    rejectInvitation,
    removeInvitation,
} from "../../controllers/invitationsController.js";

router.route("/")
    .get(getInvitations)
    .post(sendInvitation)

router.route("/:id")
    .delete(removeInvitation)

router.route("/:id/accept")
    .patch(acceptInvitation)

router.route("/:id/reject")
    .patch(rejectInvitation)

export default router;
