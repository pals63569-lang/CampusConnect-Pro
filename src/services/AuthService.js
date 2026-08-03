const userRepository = require('../repositories/UserRepository');
const Department = require('../../models/Department');
const Wishlist = require('../../models/Wishlist');
const jwt = require('jsonwebtoken');
const config = require('../../config/env');
const { BadRequestError, UnauthorizedError, NotFoundError } = require('../errors/DomainErrors');
const { sendVerificationEmail } = require('../../services/emailService');
const { uploadImage } = require('../../middleware/uploadMiddleware');

class AuthService {
  generateAccessToken(id) {
    return jwt.sign({ id }, config.jwtSecret, {
      expiresIn: config.jwtExpiresIn,
    });
  }

  generateRefreshToken(id) {
    return jwt.sign({ id }, config.jwtRefreshSecret, {
      expiresIn: config.jwtRefreshExpiresIn,
    });
  }

  generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  async registerUser(userData) {
    const { name, email, password, role, departmentName, interests, skills } = userData;

    const userExists = await userRepository.findByEmail(email);
    if (userExists) {
      throw new BadRequestError('User with this email already exists');
    }

    let deptId = null;
    if (departmentName) {
      const dept = await Department.findOne({ name: departmentName });
      if (dept) deptId = dept._id;
    }

    const otp = this.generateOTP();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

    const user = await userRepository.create({
      name,
      email,
      password,
      role: role || 'Student',
      department: deptId,
      interests: interests ? (typeof interests === 'string' ? interests.split(',').map((i) => i.trim()) : interests) : [],
      skills: skills ? (typeof skills === 'string' ? skills.split(',').map((s) => s.trim()) : skills) : [],
      otp,
      otpExpires,
      isVerified: false,
    });

    if (user.role === 'Student') {
      await Wishlist.create({ student: user._id, events: [] });
    }

    await sendVerificationEmail(user.email, otp);

    return { userId: user._id };
  }

  async verifyEmail(email, otp) {
    const user = await userRepository.findByEmail(email);
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

    return true;
  }

  async loginUser(email, password) {
    const user = await userRepository.findByEmailWithPassword(email);
    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    if (!user.isVerified) {
      const otp = this.generateOTP();
      user.otp = otp;
      user.otpExpires = new Date(Date.now() + 10 * 60 * 1000);
      await user.save();
      await sendVerificationEmail(user.email, otp);

      return { unverified: true, email: user.email };
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const accessToken = this.generateAccessToken(user._id);
    const refreshToken = this.generateRefreshToken(user._id);

    user.refreshToken = refreshToken;
    await user.save();

    return {
      accessToken,
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
    };
  }

  async forgotPassword(email) {
    const user = await userRepository.findByEmail(email);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    const otp = this.generateOTP();
    user.otp = otp;
    user.otpExpires = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    await sendVerificationEmail(user.email, otp);
    return true;
  }

  async resetPassword(email, otp, newPassword) {
    const user = await userRepository.findByEmail(email);
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

    return true;
  }

  async updateProfile(userId, bodyData, file) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    user.name = bodyData.name || user.name;
    if (bodyData.interests) {
      user.interests = typeof bodyData.interests === 'string'
        ? bodyData.interests.split(',').map((i) => i.trim())
        : bodyData.interests;
    }
    if (bodyData.skills) {
      user.skills = typeof bodyData.skills === 'string'
        ? bodyData.skills.split(',').map((s) => s.trim())
        : bodyData.skills;
    }

    if (file) {
      user.profilePic = await uploadImage(file);
    }

    const updatedUser = await user.save();
    return updatedUser;
  }

  async changePassword(userId, currentPassword, newPassword) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      throw new BadRequestError('Incorrect current password');
    }

    user.password = newPassword;
    await user.save();
    return true;
  }

  async refreshAccessToken(refreshToken) {
    if (!refreshToken) {
      throw new BadRequestError('Refresh token is required');
    }

    try {
      const decoded = jwt.verify(refreshToken, config.jwtRefreshSecret);
      const user = await userRepository.findById(decoded.id);
      if (!user || user.refreshToken !== refreshToken) {
        throw new UnauthorizedError('Invalid or revoked refresh token');
      }

      const newAccessToken = this.generateAccessToken(user._id);
      const newRefreshToken = this.generateRefreshToken(user._id);

      user.refreshToken = newRefreshToken;
      await user.save();

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      };
    } catch (_err) {
      throw new UnauthorizedError('Invalid refresh token');
    }
  }

  async logoutUser(userId) {
    if (userId) {
      await userRepository.updateRefreshToken(userId, '');
    }
    return true;
  }
}

module.exports = new AuthService();
