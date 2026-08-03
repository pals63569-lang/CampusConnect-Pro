const express = require('express');
const router = express.Router();
const {
  register,
  verifyEmail,
  login,
  refreshTokenHandler,
  forgotPassword,
  resetPassword,
  getMe,
  updateProfile,
  changePassword,
  logout,
} = require('../src/controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { upload } = require('../middleware/uploadMiddleware');
const validate = require('../middleware/validate');
const {
  registerSchema,
  verifyEmailSchema,
  loginSchema,
  refreshTokenSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
} = require('../utils/validators/authValidator');

router.post('/register', validate({ body: registerSchema }), register);
router.post('/verify-email', validate({ body: verifyEmailSchema }), verifyEmail);
router.post('/login', validate({ body: loginSchema }), login);
router.post('/refresh-token', validate({ body: refreshTokenSchema }), refreshTokenHandler);
router.post('/forgot-password', validate({ body: forgotPasswordSchema }), forgotPassword);
router.post('/reset-password', validate({ body: resetPasswordSchema }), resetPassword);

router.get('/me', protect, getMe);
router.put('/profile', protect, upload.single('profilePic'), updateProfile);
router.put('/change-password', protect, validate({ body: changePasswordSchema }), changePassword);
router.post('/logout', protect, logout);

module.exports = router;
