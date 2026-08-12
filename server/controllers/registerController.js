import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import { isValidUsername } from '../services/usernameValidationService.js';

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const handleRegister = async (req, res) => {
    const { username, password, confirmedPassword } = req.body;
    if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
    }

    if (!isValidUsername(username)) {
        return res.status(400).json({ message: "Username not valid" });
    }

    if (password.length < 8) {
        return res.status(400).json({ message: "Password must be at least 8 characters" });
    }

    if (confirmedPassword !== password) {
        return res.status(400).json({ message: "Confirmed password is not matched" });
    }

    const normalizedUsername = username.trim().toLowerCase();

    const foundUser = await User.findOne({ username: normalizedUsername });
    if (foundUser) {
        return res.status(409).json({ message: "Username is already exists" });
    }

    const hashedPwd = await bcrypt.hash(password, 10);
    const newUser = new User({
        username: normalizedUsername,
        password: hashedPwd,
    });
    await newUser.save();
    return res.sendStatus(204);
};

export { handleRegister };
