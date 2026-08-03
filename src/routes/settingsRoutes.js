const express = require('express');
const router = express.Router();
const { getSettings, updateSetting } = require('../controllers/settingsController');
const { protect } = require('../../middleware/authMiddleware');
const { hasPermission } = require('../middleware/permissionMiddleware');

router.get('/', getSettings);
router.put('/', protect, hasPermission('manage_users'), updateSetting);

module.exports = router;
