const express = require("express");
const jwt = require('jsonwebtoken');
const User = require('../models/User.js');
const { createAccessToken, sendAccessTokenCookie } = require('../services/createAuthTokensService.js');

const aTokenSecret = process.env.ACCESS_TOKEN_SECRET;
const rTokenSecret = process.env.REFRESH_TOKEN_SECRET;

const aTokenName = process.env.ACCESS_TOKEN_COOKIE_NAME;
const rTokenName = process.env.REFRESH_TOKEN_COOKIE_NAME;

/**
 * @param {string} accessToken
 * @param {string} refreshToken
 * @returns {Promise<import('express').Request["user"]>}
 */
const checkTokens = async (accessToken, refreshToken) => {
    try {
        if (accessToken) {
            const decoded = jwt.verify(accessToken, aTokenSecret);
            if (decoded) {
                return {
                    userId: decoded.userId,
                    username: decoded.username,
                    refreshTokenVersion: decoded.refreshTokenVersion,
                };
            }
        }

        if (!refreshToken) {
            console.log("middlewares#checkTokens error: no refresh token");
            throw new Error('Invalid token');
        }

        const decoded = jwt.verify(refreshToken, rTokenSecret);
        const user = await User.findById(decoded.userId);
        if (!user || user.refreshTokenVersion !== decoded.refreshTokenVersion) {
            console.log("middlewares#checkTokens error: user not found or invalid refresh token");
            throw new Error('Invalid token');
        }

        return {
            userId: user._id.toString(),
            username: user.username,
            refreshTokenVersion: user.refreshTokenVersion,
        }
    } catch (error) {
        console.log("middlewares#checkTokens error: ", error);
        throw error;
    }
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

        const decoded = await checkTokens(accessToken, refreshToken);
        req.user = decoded;
        if (decoded) {
            const newAccessToken = createAccessToken(req.user);
            sendAccessTokenCookie(res, newAccessToken);
        }

        next();
    } catch (error) {
        console.log("middlewares#authenticateToken error: ", error);
        res.status(401).json({ message: error.message });
    }
};

module.exports = authenticateToken;
