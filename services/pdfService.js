const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// Ensure directories exist
const ensureDirExist = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

const generateTicketPDF = async (registration, qrDataUrl) => {
  const uploadsDir = path.join(__dirname, '..', 'uploads', 'tickets');
  ensureDirExist(uploadsDir);

  const filename = `ticket_${registration._id}.pdf`;
  const filePath = path.join(uploadsDir, filename);

  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A6', margin: 15 });
      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      // Card Design / Border
      doc.rect(5, 5, doc.page.width - 10, doc.page.height - 10).stroke('#6366f1');

      // Title
      doc.fontSize(16).fillColor('#1e1b4b').text('CAMPUSCONNECT TICKET', { align: 'center', bold: true });
      doc.moveDown(0.5);

      // Event Info
      doc.fontSize(10).fillColor('#4b5563').text(`Event:`, { bold: true });
      doc.fontSize(12).fillColor('#1e1b4b').text(registration.event.title);
      doc.moveDown(0.5);

      doc.fontSize(10).fillColor('#4b5563').text(`Attendee:`);
      doc.fontSize(11).fillColor('#1e1b4b').text(registration.student.name);
      doc.moveDown(0.5);

      doc.fontSize(8).fillColor('#6b7280').text(`Date: ${new Date(registration.event.date).toLocaleDateString()} | Time: ${registration.event.time}`);
      doc.text(`Venue: ${registration.event.venue}`);
      doc.text(`Ticket ID: ${registration._id}`);
      if (registration.seatNumber) {
        doc.text(`Seat Number: ${registration.seatNumber}`);
      }
      doc.moveDown(0.5);

      // Embed QR Code
      if (qrDataUrl) {
        // Extract base64 image data
        const base64Data = qrDataUrl.replace(/^data:image\/png;base64,/, "");
        const qrBuffer = Buffer.from(base64Data, 'base64');
        doc.image(qrBuffer, (doc.page.width - 100) / 2, doc.y, { width: 100 });
      }

      doc.end();

      stream.on('finish', () => {
        resolve(`/uploads/tickets/${filename}`);
      });
      stream.on('error', (err) => reject(err));
    } catch (error) {
      reject(error);
    }
  });
};

const generateCertificatePDF = async (certificateData) => {
  const uploadsDir = path.join(__dirname, '..', 'uploads', 'certificates');
  ensureDirExist(uploadsDir);

  const filename = `cert_${certificateData.certificateNumber}.pdf`;
  const filePath = path.join(uploadsDir, filename);

  return new Promise((resolve, reject) => {
    try {
      // Landscape A4 certificate
      const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 40 });
      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      const width = doc.page.width;
      const height = doc.page.height;

      // Certificate Background Border
      doc.rect(20, 20, width - 40, height - 40).lineWidth(3).stroke('#6366f1');
      doc.rect(25, 25, width - 50, height - 50).lineWidth(1).stroke('#f59e0b');

      // Banner/Header
      doc.moveDown(4);
      doc.fontSize(32).fillColor('#1e1b4b').text('CERTIFICATE OF PARTICIPATION', { align: 'center', bold: true });
      doc.moveDown(1);

      doc.fontSize(14).fillColor('#4b5563').text('This certificate is proudly presented to', { align: 'center' });
      doc.moveDown(1);

      // Student Name (Highlight)
      doc.fontSize(24).fillColor('#6366f1').text(certificateData.studentName, { align: 'center', underline: true });
      doc.moveDown(1.2);

      // Details
      doc.fontSize(14).fillColor('#4b5563').text(`for outstanding participation in the college event`, { align: 'center' });
      doc.fontSize(18).fillColor('#1e1b4b').text(`"${certificateData.eventName}"`, { align: 'center', bold: true });
      doc.moveDown(1);

      doc.fontSize(11).fillColor('#6b7280').text(`Organized by the Department of ${certificateData.departmentName}`, { align: 'center' });
      doc.text(`Issued on ${new Date(certificateData.issueDate).toLocaleDateString()}`, { align: 'center' });
      doc.moveDown(2);

      // Signatures Layout
      const signatureY = height - 120;
      doc.fontSize(10).fillColor('#1e1b4b');
      
      // Left signature
      doc.text('______________________', 100, signatureY);
      doc.text('Event Coordinator', 115, signatureY + 15);

      // Right signature
      doc.text('______________________', width - 240, signatureY);
      doc.text('Dean / Principal', width - 215, signatureY + 15);

      // Embed Verification QR
      if (certificateData.qrDataUrl) {
        const base64Data = certificateData.qrDataUrl.replace(/^data:image\/png;base64,/, "");
        const qrBuffer = Buffer.from(base64Data, 'base64');
        doc.image(qrBuffer, (width - 70) / 2, height - 120, { width: 70 });
        doc.fontSize(8).fillColor('#9ca3af').text('Scan to Verify', (width - 70) / 2, height - 45, { width: 70, align: 'center' });
      }

      // Certificate Number
      doc.fontSize(9).fillColor('#9ca3af').text(`Certificate No: ${certificateData.certificateNumber}`, 40, height - 60);

      doc.end();

      stream.on('finish', () => {
        resolve(`/uploads/certificates/${filename}`);
      });
      stream.on('error', (err) => reject(err));
    } catch (error) {
      reject(error);
    }
  });
};

module.exports = {
  generateTicketPDF,
  generateCertificatePDF,
};
