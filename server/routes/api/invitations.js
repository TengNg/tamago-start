const express = require('express');
const router = express.Router();

const {
    getInvitations,
    sendInvitation,
    acceptInvitation,
    rejectInvitation,
    removeInvitation,
} = require("../../controllers/invitationsController");

router.route("/")
    .get(getInvitations)
    .post(sendInvitation)

router.route("/:id")
    .delete(removeInvitation)

router.route("/:id/accept")
    .patch(acceptInvitation)

router.route("/:id/reject")
    .patch(rejectInvitation)

module.exports = router;
