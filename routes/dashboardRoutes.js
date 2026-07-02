const express = require('express');
const router = express.Router();
const {
  getStudentDashboard,
  getFacultyDashboard,
  getAdminDashboard,
  getVolunteerDashboard,
  exportReport,
} = require('../controllers/dashboardController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.get('/student', protect, authorize('Student'), getStudentDashboard);
router.get('/faculty', protect, authorize('Faculty Coordinator', 'Admin', 'Super Admin'), getFacultyDashboard);
router.get('/admin', protect, authorize('Admin', 'Super Admin'), getAdminDashboard);
router.get('/volunteer', protect, getVolunteerDashboard);
router.get('/reports', protect, authorize('Faculty Coordinator', 'Admin', 'Super Admin'), exportReport);

module.exports = router;
