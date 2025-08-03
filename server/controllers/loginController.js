const User = require('../models/User');
const bcrypt = require('bcryptjs');
const { sendAuthCookies } = require('../services/createAuthTokensService');

const handleLogin = async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ msg: "Username and Password are required" });
    }

    const foundUser = await User.findOne({ username });
    if (!foundUser) {
        return res.status(401).json({ msg: "Username not found" });
    }

    const validPwd = await bcrypt.compare(password, foundUser.password);
    if (!validPwd) {
        return res.status(400).json({ msg: "Password is incorrect" });
    }

    sendAuthCookies(res, {
        userId: foundUser._id.toString(),
        username: foundUser.username,
        refreshTokenVersion: foundUser.refreshTokenVersion,
    });

    return res.sendStatus(204);
};

module.exports = { handleLogin };
