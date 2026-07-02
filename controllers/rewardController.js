const Reward = require('../models/Reward');
const User = require('../models/User');

// @desc    Get all reward merchandise items
// @route   GET /api/rewards
const getRewards = async (req, res, next) => {
  try {
    const rewards = await Reward.find({ stock: { $gt: 0 } });
    res.status(200).json({ success: true, count: rewards.length, rewards });
  } catch (error) {
    next(error);
  }
};

// @desc    Redeem reward item
// @route   POST /api/rewards/:id/redeem
const redeemReward = async (req, res, next) => {
  try {
    const reward = await Reward.findById(req.params.id);
    if (!reward) {
      return res.status(404).json({ success: false, message: 'Item not found in catalog' });
    }

    if (reward.stock <= 0) {
      return res.status(400).json({ success: false, message: 'Item is out of stock' });
    }

    const student = await User.findById(req.user.id);
    if (student.rewardPoints < reward.pointsRequired) {
      return res.status(400).json({
        success: false,
        message: `Insufficient reward points. Required: ${reward.pointsRequired}, Available: ${student.rewardPoints}`
      });
    }

    // Deduct points & reduce stock
    student.rewardPoints -= reward.pointsRequired;
    reward.stock -= 1;
    reward.redeemedBy.push({ student: student._id });

    await student.save();
    await reward.save();

    res.status(200).json({
      success: true,
      message: `Successfully redeemed ${reward.name}! Your remaining balance is ${student.rewardPoints} points.`,
      rewardPoints: student.rewardPoints
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create reward item (Admin only)
// @route   POST /api/rewards
const createReward = async (req, res, next) => {
  const { name, description, pointsRequired, stock } = req.body;
  try {
    const reward = await Reward.create({
      name,
      description,
      pointsRequired: parseInt(pointsRequired),
      stock: parseInt(stock) || 10,
    });
    res.status(201).json({ success: true, message: 'Reward item added to catalog', reward });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getRewards,
  redeemReward,
  createReward,
};
