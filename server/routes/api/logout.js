import express from 'express';
const router = express.Router();

import {
    handleLogout,
    handleLogoutOfAllDevices,
} from '../../controllers/logoutController.js';

router.get('/', handleLogout);
router.get('/all-devices', handleLogoutOfAllDevices);

export default router;

