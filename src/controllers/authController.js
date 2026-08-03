const authService = require('../services/AuthService');
const ResponseFormatter = require('../utils/responseFormatter');
const asyncHandler = require('../../utils/asyncHandler');
const UserDTO = require('../dtos/UserDTO');
const HttpStatusCodes = require('../constants/httpStatusCodes');

// @desc    Register a new user
// @route   POST /api/v1/auth/register
const register = asyncHandler(async (req, res) => {
  const result = await authService.registerUser(req.body);
  return ResponseFormatter.success(
    res,
    'Registration successful. Verification OTP sent to email.',
    result,
    null,
    HttpStatusCodes.CREATED
  );
});

// @desc    Verify email using OTP
// @route   POST /api/v1/auth/verify-email
const verifyEmail = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;
  await authService.verifyEmail(email, otp);
  return ResponseFormatter.success(res, 'Email verified successfully. You can now log in.');
});

// @desc    Login user & get token
// @route   POST /api/v1/auth/login
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const result = await authService.loginUser(email, password);

  if (result.unverified) {
    return res.status(403).json({
      success: false,
      message: 'Account not verified. A new OTP has been sent to your email.',
      unverified: true,
    });
  }

  return ResponseFormatter.success(res, 'Login successful', {
    token: result.accessToken,
    refreshToken: result.refreshToken,
    user: result.user,
  });
});

// @desc    Refresh access token
// @route   POST /api/v1/auth/refresh-token
const refreshTokenHandler = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  const tokens = await authService.refreshAccessToken(refreshToken);
  return ResponseFormatter.success(res, 'Token refreshed successfully', tokens);
});

// @desc    Forgot Password
// @route   POST /api/v1/auth/forgot-password
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  await authService.forgotPassword(email);
  return ResponseFormatter.success(res, 'Password reset OTP sent to email.');
});

// @desc    Reset Password
// @route   POST /api/v1/auth/reset-password
const resetPassword = asyncHandler(async (req, res) => {
  const { email, otp, newPassword } = req.body;
  await authService.resetPassword(email, otp, newPassword);
  return ResponseFormatter.success(res, 'Password reset successful. You can now log in.');
});

// @desc    Get current user profile
// @route   GET /api/v1/auth/me
const getMe = asyncHandler(async (req, res) => {
  return ResponseFormatter.success(res, 'User profile fetched', {
    user: UserDTO.toResponse(req.user),
  });
});

// @desc    Update user profile
// @route   PUT /api/v1/auth/profile
const updateProfile = asyncHandler(async (req, res) => {
  const updatedUser = await authService.updateProfile(req.user.id, req.body, req.file);
  return ResponseFormatter.success(res, 'Profile updated successfully', {
    user: UserDTO.toResponse(updatedUser),
  });
});

// @desc    Change password
// @route   PUT /api/v1/auth/change-password
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  await authService.changePassword(req.user.id, currentPassword, newPassword);
  return ResponseFormatter.success(res, 'Password updated successfully');
});

// @desc    Logout user
// @route   POST /api/v1/auth/logout
const logout = asyncHandler(async (req, res) => {
  await authService.logoutUser(req.user ? req.user.id : null);
  return ResponseFormatter.success(res, 'Logged out successfully');
});

module.exports = {
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
};
