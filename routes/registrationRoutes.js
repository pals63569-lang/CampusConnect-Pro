const express = require('express');
const router = express.Router();
const {
  registerForEvent,
  cancelRegistration,
  scanAttendance,
  downloadTicket,
  verifyCertificate,
  downloadCertificateByNo,
} = require('../controllers/registrationController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.post('/', protect, registerForEvent);
router.post('/:id/cancel', protect, cancelRegistration);
router.post(
  '/scan',
  protect,
  authorize('Admin', 'Super Admin', 'Faculty Coordinator'),
  scanAttendance
);
router.get('/:id/ticket-pdf', protect, downloadTicket);
router.get('/verify-certificate/:certNo', verifyCertificate);
router.get('/certificates/:certNo/download', protect, downloadCertificateByNo);

module.exports = router;
