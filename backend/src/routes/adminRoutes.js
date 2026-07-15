const { Router } = require('express');
const adminController = require('../controllers/adminController');
const authenticateJWT = require('../middleware/auth');
const { requireAdmin, requireModeratorOrAdmin } = require('../middleware/admin');

const router = Router();

router.use(authenticateJWT);
router.use(requireModeratorOrAdmin);

router.get('/stats', adminController.getDashboardStats);

router.get('/users', adminController.listUsersAdmin);
router.post('/users/:userId/block', requireAdmin, adminController.toggleUserBlock);
router.post('/users/:userId/role', requireAdmin, adminController.changeUserRole);

router.get('/reports', adminController.listReports);
router.put('/reports/:reportId/status', adminController.updateReportStatus);

module.exports = router;
