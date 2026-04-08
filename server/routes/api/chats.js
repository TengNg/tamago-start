import express from 'express';
const router = express.Router();

import {
    sendMessage,
    clearMessages,
    deleteMessage,
    getMessages,
} from "../../controllers/chatsController.js";

router.route("/b/:boardId")
    .get(getMessages)
    .post(sendMessage)
    .delete(clearMessages)

router.route("/b/:boardId/chats/:trackedId")
    .delete(deleteMessage)

export default router;
