const express = require('express');
const router = express.Router();

const {
    getWritedowns,
    getWritedown,
    createWritedown,
    updateTitle,
    saveWritedown,
    pinWritedown,
    deleteWritedown,
    deleteAllWritedowns,
    reorder,
} = require('../../controllers/writedownsController');

router.route("/")
    .get(getWritedowns)
    .post(createWritedown)
    .delete(deleteAllWritedowns)

router.route("/:writedownId")
    .get(getWritedown)
    .delete(deleteWritedown)
    .patch(saveWritedown)

router.route("/:writedownId/pin")
    .patch(pinWritedown)

router.route("/:writedownId/reorder")
    .patch(reorder)

router.route("/:writedownId/update-title")
    .patch(updateTitle);

module.exports = router;
