import express from 'express';
const router = express.Router();

const __prod__ = process.env.NODE_ENV === "production";
const PORT = process.env.PORT || 3001;
const SERVER_URL = process.env.SERVER_URL || `http://localhost:${PORT}`;
const FRONTEND_URL = __prod__ ? SERVER_URL : (process.env.FRONTEND_URL || "http://localhost:5173");

import { timingSafeEqual } from 'crypto';

import { sendAuthCookies } from '../../services/createAuthTokensService.js';
import { generateRandomHex } from '../../utils/generateRandomHex.js';

import User from "../../models/User.js";

const OAUTH_STATE_COOKIE = "discord_oauth_state";
const OAUTH_STATE_MAX_AGE = 10 * 60 * 1000;

/** @type import('express').CookieOptions */
const stateCookieOpts = {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: OAUTH_STATE_MAX_AGE,
};

/**
 * @param {string} a
 * @param {string} b
 * @returns {boolean}
 */
const safeEqual = (a, b) => {
    const aBuf = Buffer.from(a);
    const bBuf = Buffer.from(b);
    return aBuf.length === bBuf.length && timingSafeEqual(aBuf, bBuf);
};

router.get("/auth/discord", (_req, res) => {
    const CLIENT_ID = process.env.DISCORD_CLIENT_ID;
    const CALLBACK_URL = `${SERVER_URL}/auth/discord/callback`;
    const SCOPE = "identify email";
    const state = generateRandomHex(32);
    const discordAuthURL =
        "https://discord.com/oauth2/authorize?" +
        "client_id=" + CLIENT_ID + "&" +
        "redirect_uri=" + encodeURIComponent(CALLBACK_URL) + "&" +
        "response_type=code&" +
        "scope=" + encodeURIComponent(SCOPE) + "&" +
        "state=" + encodeURIComponent(state);
    res.cookie(OAUTH_STATE_COOKIE, state, stateCookieOpts);
    res.redirect(discordAuthURL);
});

router.get("/auth/discord/callback", async (req, res) => {
    const CLIENT_ID = process.env.DISCORD_CLIENT_ID;
    const CLIENT_SECRET = process.env.DISCORD_SECRET_ID;
    const CALLBACK_URL = `${SERVER_URL}/auth/discord/callback`;
    const FAILURE_REDIRECT_URL = `${FRONTEND_URL}/login?authorize_failed=true`;

    const code = req.query.code;
    const state = req.query.state;

    const clearStateCookie = () => res.clearCookie(OAUTH_STATE_COOKIE, stateCookieOpts);

    if (typeof code !== 'string') {
        clearStateCookie();
        return res.status(400).json({ message: 'Query parameter "code" must be a string' });
    }

    if (!code) {
        clearStateCookie();
        return res.status(400).json({ message: "Authorization code not provided!" });
    }

    const storedState = req.cookies[OAUTH_STATE_COOKIE];
    if (
        typeof state !== 'string' ||
        typeof storedState !== 'string' ||
        !safeEqual(state, storedState)
    ) {
        clearStateCookie();
        return res.redirect(`${FAILURE_REDIRECT_URL}&message=invalid_oauth_state`);
    }

    clearStateCookie();

    try {
        /*
         * docs: https://discord.com/developers/docs/topics/oauth2
         * only accept a content type of application/x-www-form-urlencoded
         * JSON content is not permitted and will return an error
         */
        const tokenResponse = await fetch("https://discord.com/api/oauth2/token", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
                client_id: CLIENT_ID,
                client_secret: CLIENT_SECRET,
                grant_type: "authorization_code",
                code,
                redirect_uri: CALLBACK_URL,
            }),
        });

        const tokenData = await tokenResponse.json();
        if (!tokenResponse.ok) {
            throw new Error("Error fetching token");
        }

        const accessToken = tokenData.access_token;
        const userResponse = await fetch("https://discord.com/api/users/@me", {
            headers: { Authorization: `Bearer ${accessToken}` },
        });

        if (!userResponse.ok) {
            throw new Error("Error fetching user data");
        }

        const currentProfile = await userResponse.json();
        if (!currentProfile.verified) {
            throw new Error("User is not verified");
        }

        let user = await User.findOne({ discordId: currentProfile.id });
        if (!user) {
            const sanitizedUsername = (currentProfile.username || "")
                .toLowerCase()
                .replace(/[^a-z0-9_]/g, "_");

            try {
                user = await User.create({
                    username: `${sanitizedUsername}_${currentProfile.id}`,
                    discordId: currentProfile.id,
                });
            } catch (err) {
                return res.redirect(FAILURE_REDIRECT_URL);
            }
        }

        /** @type import('express').Request["user"] */
        const payload = {
            userId: user.id,
            username: user.username,
            refreshTokenVersion: user.refreshTokenVersion,
        };

        sendAuthCookies(res, payload);
        return res.redirect(`${FRONTEND_URL}`);
    } catch (error) {
        console.error("Authentication error:", error);
        return res.redirect(`${FAILURE_REDIRECT_URL}&message=${error.message}`);
    }
});

export default router;
