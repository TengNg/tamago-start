const jwt = require('jsonwebtoken');

const __prod__ = process.env.NODE_ENV === 'production';

/** @type import('express').CookieOptions */
const aCookieOpts = {
    httpOnly: true,
    sameSite: __prod__ ? 'lax' : 'none',
    secure: true,
    maxAge: 15 * 60 * 1000 // 15 mins
};

/** @type import('express').CookieOptions */
const rCookieOpts = {
    httpOnly: true,
    sameSite: __prod__ ? 'lax' : 'none',
    secure: true,
    maxAge: 15 * 24 * 60 * 60 * 1000 // 15 days
};

/** @type string */
const aTokenName = process.env.ACCESS_TOKEN_COOKIE_NAME;

/** @type string */
const rTokenName = process.env.REFRESH_TOKEN_COOKIE_NAME;

/**
 * @param {import('express').Request["user"]} user
 */
const createAccessToken = (user) => {
    const { userId, username } = user;
    const accessToken = jwt.sign(
        { userId, username },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: '15min' }
    );
    return accessToken;
};

/**
 * @param {import('express').Request["user"]} user
 */
const createRefreshToken = (user) => {
    const { userId, username, refreshTokenVersion } = user;
    const refreshToken = jwt.sign(
        { userId, username, refreshTokenVersion },
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: '15d' }
    );
    return refreshToken;
};

/**
 * @param {import('express').Request["user"]} user
 */
const createAuthTokens = (user) => {
    const accessToken = createAccessToken(user);
    const refreshToken = createRefreshToken(user);
    return { accessToken, refreshToken };
};

/**
 * @param {import('express').Response} res
 * @param {string} accessToken
 */
const sendAccessTokenCookie = (res, accessToken) => {
    res.cookie(aTokenName, accessToken, aCookieOpts);
};

/**
 * @param {import('express').Response} res
 * @param {string} refreshToken
 */
const sendRefreshTokenCookie = (res, refreshToken) => {
    res.cookie(rTokenName, refreshToken, rCookieOpts);
};

/**
 * @param {import('express').Response} res
 * @param {import('express').Request["user"]} user
 */
const sendAuthCookies = (res, user) => {
    const { accessToken, refreshToken } = createAuthTokens(user);
    sendAccessTokenCookie(res, accessToken);
    sendRefreshTokenCookie(res, refreshToken);
};

/**
 * @param {import('express').Response} res
 */
const clearAuthCookies = (res) => {
    res.clearCookie(rTokenName, rCookieOpts);
    res.clearCookie(aTokenName, aCookieOpts);
};

module.exports = {
    rTokenName,
    createAccessToken,
    createRefreshToken,
    createAuthTokens,
    sendAuthCookies,
    sendAccessTokenCookie,
    sendRefreshTokenCookie,
    clearAuthCookies,
}
