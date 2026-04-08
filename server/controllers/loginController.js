import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import { sendAuthCookies } from '../services/createAuthTokensService.js';

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const handleLogin = async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ message: "Username and Password are required" });
    }

    const foundUser = await User.findOne({ username });
    if (!foundUser) {
        return res.status(401).json({ message: "Username not found" });
    }

    const validPwd = await bcrypt.compare(password, foundUser.password);
    if (!validPwd) {
        return res.status(400).json({ message: "Password is incorrect" });
    }

    sendAuthCookies(res, {
        userId: foundUser._id.toString(),
        username: foundUser.username,
        refreshTokenVersion: foundUser.refreshTokenVersion,
    });

    return res.sendStatus(204);
};

export {
    handleLogin
};
