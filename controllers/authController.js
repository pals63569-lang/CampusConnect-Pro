const User = require('../models/User');
const Department = require('../models/Department');
const Wishlist = require('../models/Wishlist');
const jwt = require('jsonwebtoken');
const config = require('../config/env');
const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { sendVerificationEmail } = require('../services/emailService');
const { uploadImage } = require('../middleware/uploadMiddleware');
const { BadRequestError, UnauthorizedError, NotFoundError } = require('../utils/customErrors');

const generateToken = (id) => {
  return jwt.sign({ id }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  });
};

const generateRefreshToken = (id) => {
  return jwt.sign({ id }, config.jwtRefreshSecret, {
    expiresIn: config.jwtRefreshExpiresIn,
  });
};

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// @desc    Register a new user
// @route   POST /api/v1/auth/register
const register = asyncHandler(async (req, res) => {
  const { name, email, password, role, departmentName, interests, skills } = req.body;

  const userExists = await User.findOne({ email });
  if (userExists) {
    throw new BadRequestError('User with this email already exists');
  }

  let deptId = null;
  if (departmentName) {
    const dept = await Department.findOne({ name: departmentName });
    if (dept) deptId = dept._id;
  }

  const otp = generateOTP();
  const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

  // Mongoose pre-save hook handles bcrypt hashing
  const user = await User.create({
    name,
    email,
    password,
    role: role || 'Student',
    department: deptId,
    interests: interests ? (typeof interests === 'string' ? interests.split(',').map(i => i.trim()) : interests) : [],
    skills: skills ? (typeof skills === 'string' ? skills.split(',').map(s => s.trim()) : skills) : [],
    otp,
    otpExpires,
    isVerified: false,
  });

  if (user.role === 'Student') {
    await Wishlist.create({ student: user._id, events: [] });
  }

  await sendVerificationEmail(user.email, otp);

  return ApiResponse.success(
    res,
    'Registration successful. Verification OTP sent to email.',
    { userId: user._id },
    201
  );
});

// @desc    Verify email using OTP
// @route   POST /api/v1/auth/verify-email
const verifyEmail = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    throw new NotFoundError('User not found');
  }

  if (user.isVerified) {
    throw new BadRequestError('User is already verified');
  }

  if (user.otp !== otp || !user.otpExpires || user.otpExpires < Date.now()) {
    throw new BadRequestError('Invalid or expired OTP');
  }

  user.isVerified = true;
  user.otp = undefined;
  user.otpExpires = undefined;
  await user.save();

  return ApiResponse.success(res, 'Email verified successfully. You can now log in.');
});

// @desc    Login user & get token
// @route   POST /api/v1/auth/login
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).populate('department');
  if (!user) {
    throw new UnauthorizedError('Invalid email or password');
  }

  if (!user.isVerified) {
    const otp = generateOTP();
    user.otp = otp;
    user.otpExpires = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();
    await sendVerificationEmail(user.email, otp);

    return res.status(403).json({
      success: false,
      message: 'Account not verified. A new OTP has been sent to your email.',
      unverified: true,
    });
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new UnauthorizedError('Invalid email or password');
  }

  const accessToken = generateToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  user.refreshToken = refreshToken;
  await user.save();

  return ApiResponse.success(res, 'Login successful', {
    token: accessToken,
    refreshToken,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department ? user.department.name : null,
      profilePic: user.profilePic,
      rewardPoints: user.rewardPoints,
    },
  });
});

// @desc    Refresh access token
// @route   POST /api/v1/auth/refresh-token
const refreshTokenHandler = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    throw new BadRequestError('Refresh token is required');
  }

  try {
    const decoded = jwt.verify(refreshToken, config.jwtRefreshSecret);
    const user = await User.findById(decoded.id);
    if (!user || user.refreshToken !== refreshToken) {
      throw new UnauthorizedError('Invalid or revoked refresh token');
    }

    const newAccessToken = generateToken(user._id);
    const newRefreshToken = generateRefreshToken(user._id);

    user.refreshToken = newRefreshToken;
    await user.save();

    return ApiResponse.success(res, 'Token refreshed successfully', {
      token: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (err) {
    throw new UnauthorizedError('Invalid refresh token');
  }
});

// @desc    Forgot Password
// @route   POST /api/v1/auth/forgot-password
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    throw new NotFoundError('User not found');
  }

  const otp = generateOTP();
  user.otp = otp;
  user.otpExpires = new Date(Date.now() + 10 * 60 * 1000);
  await user.save();

  await sendVerificationEmail(user.email, otp);

  return ApiResponse.success(res, 'Password reset OTP sent to email');
});

// @desc    Reset Password
// @route   POST /api/v1/auth/reset-password
const resetPassword = asyncHandler(async (req, res) => {
  const { email, otp, newPassword } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    throw new NotFoundError('User not found');
  }

  if (user.otp !== otp || !user.otpExpires || user.otpExpires < Date.now()) {
    throw new BadRequestError('Invalid or expired OTP');
  }

  user.password = newPassword;
  user.otp = undefined;
  user.otpExpires = undefined;
  await user.save();

  return ApiResponse.success(res, 'Password reset successful. You can now log in.');
});

// @desc    Get current user profile
// @route   GET /api/v1/auth/me
const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id)
    .populate('department')
    .populate('badges');
  return ApiResponse.success(res, 'User profile fetched', { user });
});

// @desc    Update user profile
// @route   PUT /api/v1/auth/profile
const updateProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) {
    throw new NotFoundError('User not found');
  }

  user.name = req.body.name || user.name;
  if (req.body.interests) {
    user.interests = typeof req.body.interests === 'string'
      ? req.body.interests.split(',').map(i => i.trim())
      : req.body.interests;
  }
  if (req.body.skills) {
    user.skills = typeof req.body.skills === 'string'
      ? req.body.skills.split(',').map(s => s.trim())
      : req.body.skills;
  }

  if (req.file) {
    user.profilePic = await uploadImage(req.file);
  }

  const updatedUser = await user.save();
  return ApiResponse.success(res, 'Profile updated successfully', {
    user: {
      id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      profilePic: updatedUser.profilePic,
      interests: updatedUser.interests,
      skills: updatedUser.skills,
    },
  });
});

// @desc    Change password for logged-in user
// @route   PUT /api/v1/auth/change-password
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user.id);
  if (!user) {
    throw new NotFoundError('User not found');
  }

  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) {
    throw new BadRequestError('Incorrect current password');
  }

  user.password = newPassword;
  await user.save();

  return ApiResponse.success(res, 'Password updated successfully');
});

// @desc    Logout user
// @route   POST /api/v1/auth/logout
const logout = asyncHandler(async (req, res) => {
  if (req.user) {
    await User.findByIdAndUpdate(req.user.id, { refreshToken: '' });
  }
  return ApiResponse.success(res, 'Logged out successfully');
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
