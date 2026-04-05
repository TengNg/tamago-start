const express = require('express');
const router = express.Router();
const pinnedBoardRouter = express.Router();

const {
    getCurrentUser,
    updateUsername,
    updatePassword,
    addPinnedBoard,
    deletePinnedBoard,
    updatePinnedBoards,
    cleanPinnedBoards,
} = require("../../controllers/userController");

router.route("/")
    .get(getCurrentUser);

router.route("/username")
    .patch(updateUsername);

router.route("/password")
    .patch(updatePassword);

// pinned-boards router

router.use("/pinned-boards", pinnedBoardRouter);

pinnedBoardRouter.route("/:id")
    .patch(addPinnedBoard)
    .delete(deletePinnedBoard)

pinnedBoardRouter.route("/")
    .patch(updatePinnedBoards)
    .delete(cleanPinnedBoards)

module.exports = router;
