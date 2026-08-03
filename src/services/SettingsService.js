const SystemSetting = require('../models/SystemSetting');

class SettingsService {
  async getSettings() {
    const settings = await SystemSetting.find().lean();
    const settingsMap = {};
    settings.forEach((s) => {
      settingsMap[s.key] = s.value;
    });
    return settingsMap;
  }

  async updateSetting(key, value, category = 'General', userId) {
    const setting = await SystemSetting.findOneAndUpdate(
      { key },
      { value, category, updatedBy: userId },
      { upsert: true, new: true }
    );
    return setting;
  }
}

module.exports = new SettingsService();
