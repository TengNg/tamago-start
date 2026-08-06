import express from "express";
import jwt from "jsonwebtoken";
import User from '../models/User.js';
import { createAccessToken, sendAccessTokenCookie } from '../services/createAuthTokensService.js';

const aTokenSecret = process.env.ACCESS_TOKEN_SECRET;
const rTokenSecret = process.env.REFRESH_TOKEN_SECRET;

const aTokenName = process.env.ACCESS_TOKEN_COOKIE_NAME;
const rTokenName = process.env.REFRESH_TOKEN_COOKIE_NAME;

/**
 * @param {string} accessToken
 * @param {string} refreshToken
 * @returns {Promise<{ user: import('express').Request["user"], refreshed: boolean }>}
 */
const checkTokens = async (accessToken, refreshToken) => {
    if (accessToken) {
        try {
            const data = verifyToken(accessToken, aTokenSecret);
            return {
                user: {
                    userId: data.userId,
                    username: data.username,
                },
                refreshed: false,
            };
        } catch {
            // expired or otherwise invalid access token
            // fall through to refresh
        }
    }

    if (!refreshToken) {
        throw new Error("unauthorized");
    }

    let data;
    try {
        data = verifyToken(refreshToken, rTokenSecret);
    } catch {
        throw new Error("unauthorized");
    }

    const user = await User.findById(data.userId);
    if (!user || user.refreshTokenVersion !== data.refreshTokenVersion) {
        if (process.env.NODE_ENV === "development") {
            console.log("middlewares#checkTokens error: user not found or invalid refresh token");
        }

        throw new Error("unauthorized");
    }

    return {
        user: {
            userId: user._id.toString(),
            username: user.username,
            refreshTokenVersion: user.refreshTokenVersion,
        },
        refreshed: true,
    };
};

/**
 * @param {express.Request} req
 * @param {express.Response} res
 * @param {express.NextFunction} next
 */
const authenticateToken = async (req, res, next) => {
    try {
        const accessToken = req.cookies[aTokenName];
        const refreshToken = req.cookies[rTokenName];
        if (!accessToken && !refreshToken) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const { user, refreshed } = await checkTokens(accessToken, refreshToken);
        req.user = user;
        if (refreshed) {
            const newAccessToken = createAccessToken(req.user);
            sendAccessTokenCookie(res, newAccessToken);
        }

        next();
    } catch (error) {
        console.log("middlewares#authenticateToken error: ", error);
        res.status(401).json({ message: error.message });
    }
};

/**
 * @param {string} token
 * @param {string} secret
 * @returns {AuthJwtPayload}
 */
const verifyToken = (token, secret) => {
    const decoded = jwt.verify(token, secret);

    if (typeof decoded === "string") {
        throw new Error("Invalid token");
    }

    return /** @type {AuthJwtPayload} */ (decoded);
};

export { checkTokens };
export default authenticateToken;
