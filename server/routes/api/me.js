const express = require('express');
const router = express.Router();
const User = require('../../models/User.js');
const { sanitizeUser } = require('../../services/userService.js');

const getCurrentUser = async (req, res) => {
    const { userId } = req.user;
    const user = await User.findById(userId).select('-password -refreshTokenVersion');
    if (!user) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    res.json({ user: sanitizeUser(user) });
}

router.get('/', getCurrentUser);

module.exports = router;
