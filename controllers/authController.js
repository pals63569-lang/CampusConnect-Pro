const User = require('../models/User');
const Role = require('../models/Role');
const Department = require('../models/Department');
const Wishlist = require('../models/Wishlist');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { sendVerificationEmail } = require('../services/emailService');
const { uploadImage } = require('../middleware/uploadMiddleware');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString(); // 6 digit OTP
};

// @desc    Register a new user
// @route   POST /api/auth/register
const register = async (req, res, next) => {
  const { name, email, password, role, departmentName, interests, skills } = req.body;

  try {
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    // Find department if name is provided
    let deptId = null;
    if (departmentName) {
      const dept = await Department.findOne({ name: departmentName });
      if (dept) deptId = dept._id;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Create user
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: role || 'Student',
      department: deptId,
      interests: interests ? interests.split(',').map(i => i.trim()) : [],
      skills: skills ? skills.split(',').map(s => s.trim()) : [],
      otp,
      otpExpires,
      isVerified: false,
    });

    // Create a wishlist for the student
    if (user.role === 'Student') {
      await Wishlist.create({ student: user._id, events: [] });
    }

    // Send OTP email
    await sendVerificationEmail(user.email, otp);

    res.status(201).json({
      success: true,
      message: 'Registration successful. Verification OTP sent to email.',
      userId: user._id,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify email using OTP
// @route   POST /api/auth/verify-email
const verifyEmail = async (req, res, next) => {
  const { email, otp } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.isVerified) {
      return res.status(400).json({ success: false, message: 'User already verified' });
    }

    if (user.otp !== otp || user.otpExpires < Date.now()) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    }

    user.isVerified = true;
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Email verified successfully. You can now log in.',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Login user & get token
// @route   POST /api/auth/login
const login = async (req, res, next) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email }).populate('department');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    if (!user.isVerified) {
      // Resend OTP
      const otp = generateOTP();
      user.otp = otp;
      user.otpExpires = new Date(Date.now() + 10 * 60 * 1000);
      await user.save();
      await sendVerificationEmail(user.email, otp);
      return res.status(403).json({
        success: false,
        message: 'Account not verified. A new OTP has been sent to your email.',
        unverified: true
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    res.status(200).json({
      success: true,
      token: generateToken(user._id),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department ? user.department.name : null,
        profilePic: user.profilePic,
        rewardPoints: user.rewardPoints
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Forgot Password
// @route   POST /api/auth/forgot-password
const forgotPassword = async (req, res, next) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const otp = generateOTP();
    user.otp = otp;
    user.otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    await user.save();

    await sendVerificationEmail(user.email, otp);

    res.status(200).json({
      success: true,
      message: 'Password reset OTP sent to email.',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reset Password
// @route   POST /api/auth/reset-password
const resetPassword = async (req, res, next) => {
  const { email, otp, newPassword } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.otp !== otp || user.otpExpires < Date.now()) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password reset successful. You can now login.',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id)
      .populate('department')
      .populate('badges');
    res.status(200).json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
const updateProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.name = req.body.name || user.name;
    if (req.body.interests) {
      user.interests = req.body.interests.split(',').map(i => i.trim());
    }
    if (req.body.skills) {
      user.skills = req.body.skills.split(',').map(s => s.trim());
    }

    if (req.file) {
      user.profilePic = await uploadImage(req.file);
    }

    const updatedUser = await user.save();
    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        profilePic: updatedUser.profilePic,
        interests: updatedUser.interests,
        skills: updatedUser.skills
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Change password for logged-in user
// @route   PUT /api/auth/change-password
const changePassword = async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Incorrect current password' });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.status(200).json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Logout user (clear session response)
// @route   POST /api/auth/logout
const logout = async (req, res, next) => {
  res.status(200).json({ success: true, message: 'Logged out successfully' });
};

module.exports = {
  register,
  verifyEmail,
  login,
  forgotPassword,
  resetPassword,
  getMe,
  updateProfile,
  changePassword,
  logout
};

