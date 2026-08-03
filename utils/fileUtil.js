const fs = require('fs');
const path = require('path');
const logger = require('./logger');

/**
 * Safely delete a file from the server's local storage.
 * @param {String} relativeOrAbsolutePath Path to the file to be deleted.
 */
const safeDeleteFile = (relativeOrAbsolutePath) => {
  if (!relativeOrAbsolutePath || relativeOrAbsolutePath.startsWith('http')) {
    return; // Skip remote URLs like Cloudinary or empty paths
  }

  try {
    const fullPath = path.isAbsolute(relativeOrAbsolutePath)
      ? relativeOrAbsolutePath
      : path.join(__dirname, '..', relativeOrAbsolutePath.replace(/^\//, ''));

    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
      logger.info(`Deleted file: ${fullPath}`);
    }
  } catch (error) {
    logger.error(`Error deleting file (${relativeOrAbsolutePath}): ${error.message}`);
  }
};

module.exports = {
  safeDeleteFile,
};
