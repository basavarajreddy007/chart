const { Router } = require('express');
const authController = require('../controllers/authController');
const { authLimiter } = require('../middleware/rateLimiter');
const authenticateJWT = require('../middleware/auth');

const router = Router();

router.post('/register', authLimiter, authController.register);
router.post('/verify-otp', authController.verifyOTP);
router.post('/login', authLimiter, authController.login);
router.post('/firebase-login', authLimiter, authController.firebaseLogin);
router.post('/refresh-token', authController.refreshToken);
router.post('/logout', authController.logout);

router.post('/setup-2fa', authenticateJWT, authController.setup2FA);
router.post('/toggle-2fa', authenticateJWT, authController.toggle2FA);

module.exports = router;
