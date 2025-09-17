const express = require('express');
const router = express.Router();

const {
    getBoards,
    getOwnedBoards,
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
    togglePinBoard,
    deletePinnedBoard,
    cleanPinnedBoardsCollection,
    updatePinnedBoardsCollection,
} = require('../../controllers/boardsController');

router.route("/")
    .get(getBoards)
    .post(createBoard)

router.route("/owned")
    .get(getOwnedBoards)

router.route("/:id")
    .get(getBoard)
    .delete(closeBoard)

router.route("/:id/stats")
    .get(getBoardStats)

router.route("/:id/members/leave")
    .patch(leaveBoard)

router.route("/:id/members/:memberName")
    .patch(removeMemberFromBoard)

router.route("/:id/new-title")
    .patch(updateTitle)

router.route("/:id/new-description")
    .patch(updateDescription)

router.route("/:id/new-visibility")
    .patch(updateVisibility)

router.route("/copy/:id")
    .post(copyBoard)

router.route("/:id/pinned")
    .patch(togglePinBoard)
    .delete(deletePinnedBoard)

router.route("/pinned/update")
    .patch(updatePinnedBoardsCollection)

router.route("/pinned/clean")
    .patch(cleanPinnedBoardsCollection)

module.exports = router;
