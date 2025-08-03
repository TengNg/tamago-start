const express = require('express');
const router = express.Router();

const {
    handleLogout,
    handleLogoutOfAllDevices,
} = require('../../controllers/logoutController');

router.get('/', handleLogout);
router.get('/all-devices', handleLogoutOfAllDevices);

module.exports = router;
