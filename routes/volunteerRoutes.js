const express = require('express');
const router = express.Router();
const {
  applyToVolunteer,
  getVolunteers,
  updateVolunteerStatus,
  assignTasks,
  updateTaskStatus,
  logHours,
} = require('../controllers/volunteerController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.post('/apply', protect, applyToVolunteer);
router.get('/event/:eventId', protect, authorize('Admin', 'Super Admin', 'Faculty Coordinator'), getVolunteers);
router.patch('/:id/status', protect, authorize('Admin', 'Super Admin', 'Faculty Coordinator'), updateVolunteerStatus);
router.post('/:id/tasks', protect, authorize('Admin', 'Super Admin', 'Faculty Coordinator'), assignTasks);
router.patch('/:id/tasks/:taskId', protect, updateTaskStatus);
router.patch('/:id/hours', protect, authorize('Admin', 'Super Admin', 'Faculty Coordinator'), logHours);

module.exports = router;
