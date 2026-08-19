import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import { rTokenName, clearAuthCookies } from '../services/createAuthTokensService.js';

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const handleLogout = async (req, res) => {
    const cookies = req.cookies;
    if (!cookies || !cookies[rTokenName]) return res.sendStatus(204);

    clearAuthCookies(res);

    res.sendStatus(204);
}

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const handleLogoutOfAllDevices = async (req, res) => {
    const cookies = req.cookies;
    if (!cookies || !cookies[rTokenName]) return res.sendStatus(204);

    const refreshToken = cookies[rTokenName];
    let data;
    try {
        data = /** @type AuthJwtPayload */ (
            jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET)
        );
    } catch {
        return res.status(401).json({ message: "unauthorized" });
    }

    await User.findOneAndUpdate(
        { _id: data.userId },
        { $inc: { refreshTokenVersion: 1 } }
    );

    clearAuthCookies(res);

    res.sendStatus(204);
}

export {
    handleLogout,
    handleLogoutOfAllDevices,
}
