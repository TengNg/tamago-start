import express from 'express';
const router = express.Router();

import {
    sendMessage,
    clearMessages,
    deleteMessage,
    getMessages,
} from "../../controllers/chatsController.js";

router.route("/b/:boardId/messages")
    .get(getMessages)
    .post(sendMessage)
    .delete(clearMessages)

router.route("/b/:boardId/messages/:id")
    .delete(deleteMessage)

export default router;
