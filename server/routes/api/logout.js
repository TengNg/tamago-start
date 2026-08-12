import express from 'express';
const router = express.Router();

import {
    handleLogout,
    handleLogoutOfAllDevices,
} from '../../controllers/logoutController.js';

router.post('/', handleLogout);
router.post('/all-devices', handleLogoutOfAllDevices);

export default router;

