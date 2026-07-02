const QRCode = require('qrcode');

const generateQRCode = async (text) => {
  try {
    const dataUrl = await QRCode.toDataURL(text);
    return dataUrl;
  } catch (err) {
    console.error('Error generating QR Code:', err);
    throw err;
  }
};

module.exports = {
  generateQRCode,
};
