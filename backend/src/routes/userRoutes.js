const { Router } = require('express');
const userController = require('../controllers/userController');
const authenticateJWT = require('../middleware/auth');

const router = Router();

router.use(authenticateJWT);

router.get('/profile', userController.getProfile);
router.put('/profile', userController.updateProfile);
router.get('/search', userController.searchUsers);
router.get('/instagram', userController.getInstagramUsers);
router.get('/:userId', userController.getPublicProfile);

module.exports = router;
