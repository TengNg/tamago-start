const User = require('../models/User.js');
const bcrypt = require('bcryptjs');
const { usernameRegex } = require('../data/regex');

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const updateUsername = async (req, res) => {
    const { userId } = req.user;
    const { newUsername } = req.body;

    const user = await User.findById(userId);
    if (!user) {
        return res.status(403).json({ msg: "user not found" });
    }

    const foundUser = await User.findOne({ username: newUsername })
    if (foundUser) {
        return res.status(409).json({ msg: "Username is already exists" });
    }

    if (!usernameRegex.test(newUsername)) {
        return res.status(400).json({ msg: "Username not valid" });
    }

    user.username = newUsername;
    await user.save();

    res.sendStatus(204);
}

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const updatePassword = async (req, res) => {
    const { userId } = req.user;
    const { currentPassword, newPassword } = req.body;

    if (!newPassword) {
        return res.status(200).json({
            notice: 'PLEASE_PROVIDE_NEW_PASSWORD',
            msg: 'Please provide new password',
        })
    }

    const foundUser = await User.findById(userId);
    if (!foundUser) {
        return res.status(401).json({ msg: "Unauthorized" });
    }

    if (foundUser.discordId) {
        return res.status(400).json({ msg: "Cannot change password" });
    }

    const validPwd = await bcrypt.compare(currentPassword, foundUser.password);
    if (!validPwd) {
        return res.status(400).json({ msg: "Password is incorrect" });
    }

    if (newPassword === currentPassword) {
        return res.status(200).json({
            notice: 'PASSWORD_NOT_CHANGED',
            msg: "New password is the same as current password",
        });
    }

    const hashedPwd = await bcrypt.hash(newPassword, 10);
    foundUser.password = hashedPwd;
    await foundUser.save();

    res.sendStatus(204);
};

module.exports = {
    updateUsername,
    updatePassword,
}
