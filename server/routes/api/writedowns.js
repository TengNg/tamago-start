import express from 'express';
const router = express.Router();

import {
    getWritedowns,
    getWritedown,
    createWritedown,
    updateTitle,
    saveWritedown,
    pinWritedown,
    deleteWritedown,
    deleteAllWritedowns,
    reorder,
} from '../../controllers/writedownsController.js';

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

router.route("/:writedownId/title")
    .patch(updateTitle);

export default router;
