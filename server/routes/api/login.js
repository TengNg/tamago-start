import express from 'express';
const router = express.Router();

import { handleLogin } from '../../controllers/loginController.js';

router.post('/', handleLogin);

export default router;
