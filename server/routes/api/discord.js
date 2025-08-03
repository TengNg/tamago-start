const express = require('express');
const router = express.Router();

const __prod__ = process.env.MODE === "production";
const PORT = process.env.PORT || 3001;
const SERVER_URL = process.env.SERVER_URL || `http://localhost:${PORT}`;
const FRONTEND_URL = __prod__ ? SERVER_URL : (process.env.FRONTEND_URL || "http://localhost:5173");

const { sendAuthCookies } = require('../../services/createAuthTokensService');
const { generateRandomHex } = require('../../utils/generateRandomHex');

router.get("/auth/discord", (_req, res) => {
    const CLIENT_ID = process.env.DISCORD_CLIENT_ID;
    const CALLBACK_URL = `${SERVER_URL}/auth/discord/callback`;
    const SCOPE = "identify email";
    const discordAuthURL =
        "https://discord.com/oauth2/authorize?" +
        "client_id=" + CLIENT_ID + "&" +
        "redirect_uri=" + encodeURIComponent(CALLBACK_URL) + "&" +
        "response_type=code&" +
        "scope=" + encodeURIComponent(SCOPE);
    res.redirect(discordAuthURL);
});

router.get("/auth/discord/callback", async (req, res) => {
    const CLIENT_ID = process.env.DISCORD_CLIENT_ID;
    const CLIENT_SECRET = process.env.DISCORD_SECRET_ID;
    const CALLBACK_URL = `${SERVER_URL}/auth/discord/callback`;
    const FAILURE_REDIRECT_URL = `${FRONTEND_URL}/login?authorize_failed=true`;

    const code = req.query.code;

    if (typeof code !== 'string') {
        return res.status(400).json({ error: 'Query parameter "code" must be a string' });
    }

    if (!code) {
        return res.status(400).json({ error: "Authorization code not provided!" });
    }

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

        const User = require("../../models/User");
        let user = await User.findOne({ discordId: currentProfile.id });
        if (!user) {
            const secureId = generateRandomHex(10);
            const initialUsername = `${currentProfile.username}-${secureId}`;
            try {
                user = await User.create({
                    username: initialUsername,
                    discordId: currentProfile.id
                });
            } catch (err) {
                return res.redirect(FAILURE_REDIRECT_URL);
            }
        }

        /** @type UserPayload */
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

module.exports = router;
