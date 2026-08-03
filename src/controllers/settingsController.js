const settingsService = require('../services/SettingsService');
const ResponseFormatter = require('../utils/responseFormatter');
const asyncHandler = require('../../utils/asyncHandler');

const getSettings = asyncHandler(async (req, res) => {
  const settings = await settingsService.getSettings();
  return ResponseFormatter.success(res, 'System settings fetched', { settings });
});

const updateSetting = asyncHandler(async (req, res) => {
  const { key, value, category } = req.body;
  const setting = await settingsService.updateSetting(key, value, category, req.user.id);
  return ResponseFormatter.success(res, `Setting '${key}' updated successfully`, { setting });
});

module.exports = { getSettings, updateSetting };
