const express = require('express');
const router = express.Router();

const {
    updateUsername,
    updatePassword,
} = require("../../controllers/userController");

router.route("/new-username")
    .patch(updateUsername);

router.route("/new-password")
    .patch(updatePassword);

module.exports = router;
