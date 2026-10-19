import { Router } from 'express';
import { authController } from '../controllers/auth.controller.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';

const router = Router();

router.post('/register', authController.register);
router.post('/register-otp', authController.sendRegisterOtp);
router.post('/verify-register-otp', authController.verifyRegisterOtp);
router.post('/forgot-password-otp', authController.sendForgotPasswordOtp);
router.post('/reset-password', authController.resetPassword);
router.post('/login', authController.login);
router.post('/logout', authController.logout);
router.get('/me', authenticateToken, authController.getMe);
router.post('/refresh', authController.refreshToken);
router.post('/demo-login', authController.demoLogin);

export default router;
