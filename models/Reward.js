const mongoose = require('mongoose');

const redemptionSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  redeemDate: { type: Date, default: Date.now }
});

const rewardSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  description: {
    type: String,
    required: true,
  },
  pointsRequired: {
    type: Number,
    required: true,
  },
  stock: {
    type: Number,
    required: true,
    default: 0,
  },
  redeemedBy: [redemptionSchema]
}, { timestamps: true });

module.exports = mongoose.model('Reward', rewardSchema);
