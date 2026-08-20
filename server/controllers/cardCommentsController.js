import CardComment from "../models/CardComment.js";
import Card from "../models/Card.js";
import { checkBoardPermission } from '../services/boardPermissionService.js';
import saveBoardActivity from '../services/saveBoardActivity.js';
import { SOCKET_EVENTS } from '../../shared/socket-events.js';
import { emitToBoard } from '../socket/registry.js';

const COMMENTS_PER_PAGE = 20;

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const getCardComments = async (req, res) => {
    const { userId } = req.user;
    const { cardId } = req.params;
    const foundCard = await Card.findById(cardId).lean();
    if (!foundCard) {
        return res.sendStatus(404);
    }

    await checkBoardPermission({
        boardId: foundCard.boardId.toString(),
        userId,
        resource: "comment",
        action: "view"
    })

    let { perPage, page } = req.query;
    const perPageNum = Math.min(
        Math.max(Number(Array.isArray(perPage) ? perPage[0] : perPage) || COMMENTS_PER_PAGE, 1),
        50,
    );
    const pageNum = Math.max(Number(Array.isArray(page) ? page[0] : page) || 1, 1);

    const comments = await CardComment
        .find({ cardId: foundCard._id })
        .skip((pageNum - 1) * perPageNum)
        .limit(perPageNum)
        .populate('userId', '_id username profileImage')
        .sort({ createdAt: -1 })
        .select('_id content createdAt')
        .lean();

    const nextPage = comments.length < perPageNum ? null : pageNum + 1;
    res.status(200).json({ comments, nextPage });
};

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const getCardComment = async (req, res) => {
    const { userId } = req.user;
    const { cardId, commentId } = req.params;
    const foundCard = await Card.findById(cardId).lean();
    if (!foundCard) {
        return res.sendStatus(404);
    }

    await checkBoardPermission({
        boardId: foundCard.boardId.toString(),
        userId,
        resource: "comment",
        action: "view"
    })

    const foundComment = await CardComment.findOne({
        cardId: foundCard._id,
        _id: commentId,
    }).populate('userId', '_id username profileImage');
    if (!foundComment) {
        return res.sendStatus(404);
    }

    const commentsBefore = await CardComment.countDocuments({
        cardId: foundCard._id,
        createdAt: { $gt: foundComment.createdAt },
    });

    const comment = {
        _id: foundComment._id,
        content: foundComment.content,
        createdAt: foundComment.createdAt,
        userId: foundComment.userId,
        onFirstPage: commentsBefore < COMMENTS_PER_PAGE,
    };

    res.status(200).json({ comment });
};

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const createCardComment = async (req, res) => {
    const { cardId } = req.params;
    const { userId } = req.user;
    const { content } = req.body;
    const foundCard = await Card.findById(cardId).lean();
    if (!foundCard) {
        return res.sendStatus(404);
    }

    await checkBoardPermission({
        boardId: foundCard.boardId.toString(),
        userId,
        resource: "comment",
        action: "create"
    })

    const newComment = new CardComment({
        cardId: foundCard._id,
        userId,
        content,
    });
    await newComment.save();

    const commentWithUser = await CardComment
        .findById(newComment._id)
        .populate('userId', '_id username')
        .lean();

    let truncatedContent = "";
    if (commentWithUser.content.length > 500) {
        truncatedContent = commentWithUser.content.slice(0, 500) + '...';
    } else {
        truncatedContent = commentWithUser.content
    }

    await saveBoardActivity({
        boardId: foundCard.boardId,
        userId,
        docId: foundCard._id,
        action: "comment.created",
        description: truncatedContent,
        docModel: "Card",
        docTitle: foundCard.title,
    });

    emitToBoard(foundCard.boardId, SOCKET_EVENTS.COMMENT_CREATED, {
        comment: commentWithUser,
    });

    res.status(201).json({ comment: commentWithUser });
};

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const deleteCardComment = async (req, res) => {
    const { userId } = req.user;
    const { commentId } = req.params;
    const foundComment = await CardComment.findById(commentId).populate({
        path: "cardId",
        select: "boardId",
    });
    if (!foundComment) {
        return res.sendStatus(404);
    }

    await checkBoardPermission({
        boardId: /** @type any */(foundComment.cardId).boardId.toString(),
        userId,
        resource: "comment",
        action: "delete"
    })

    if (foundComment.userId.toString() !== userId) {
        return res.status(403).json({ message: "Can't delete comments from others" });
    }

    await CardComment.findOneAndDelete({ _id: commentId });

    const cardId = /** @type any */(foundComment.cardId)._id.toString();
    emitToBoard(/** @type any */(foundComment.cardId).boardId, SOCKET_EVENTS.COMMENT_DELETED, {
        commentId,
        cardId,
    });

    res.sendStatus(204);
};

export {
    getCardComments,
    getCardComment,
    createCardComment,
    deleteCardComment,
};
