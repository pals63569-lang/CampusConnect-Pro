const express = require('express');
const router = express.Router();
const {
  getRewards,
  redeemReward,
  createReward,
} = require('../controllers/rewardController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.get('/', protect, getRewards);
router.post('/:id/redeem', protect, redeemReward);
router.post('/', protect, authorize('Admin', 'Super Admin'), createReward);

module.exports = router;
