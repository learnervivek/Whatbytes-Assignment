import express from 'express';
import { register, login } from '../controllers/authController.js';

const router = express.Router();

// Support both '/register' and '/register/'
router.post(['/register', '/register/'], register);

// Support both '/login' and '/login/'
router.post(['/login', '/login/'], login);

export default router;
