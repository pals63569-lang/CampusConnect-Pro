const nodemailer = require('nodemailer');
require('dotenv').config();

let transporter;

const isConfigured = 
  process.env.EMAIL_HOST && 
  process.env.EMAIL_USER && 
  process.env.EMAIL_PASS;

if (isConfigured) {
  transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: process.env.EMAIL_PORT === '465',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
  console.log('Email Transporter Initialized.');
} else {
  console.log('Email credentials missing. Emails will be logged to server console.');
}

const sendEmail = async (options) => {
  if (isConfigured) {
    try {
      const mailOptions = {
        from: process.env.EMAIL_FROM || 'noreply@campusconnect.edu',
        to: options.to,
        subject: options.subject,
        html: options.html,
        attachments: options.attachments || [],
      };
      await transporter.sendMail(mailOptions);
      console.log(`Email sent successfully to ${options.to}`);
    } catch (error) {
      console.error(`Error sending email to ${options.to}:`, error);
    }
  } else {
    console.log('\n--- MOCK EMAIL SENT ---');
    console.log(`To: ${options.to}`);
    console.log(`Subject: ${options.subject}`);
    console.log(`Content Summary: ${options.html.substring(0, 300)}...`);
    console.log('-----------------------\n');
  }
};

const sendVerificationEmail = async (to, otp) => {
  const html = `
    <div style="font-family: Poppins, sans-serif; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
      <h2 style="color: #6366f1;">CampusConnect-Pro Email Verification</h2>
      <p>Thank you for registering! Please use the following One-Time Password (OTP) to verify your account:</p>
      <div style="font-size: 24px; font-weight: bold; background: #f3f4f6; padding: 10px 20px; text-align: center; border-radius: 6px; letter-spacing: 4px; color: #1e1b4b; display: inline-block;">
        ${otp}
      </div>
      <p>This OTP is valid for 10 minutes. If you did not request this verification, please ignore this email.</p>
    </div>
  `;
  await sendEmail({ to, subject: 'Verify Your CampusConnect Account', html });
};

const sendRegistrationTicket = async (to, eventName, ticketNumber, pdfPath) => {
  const html = `
    <div style="font-family: Poppins, sans-serif; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
      <h2 style="color: #10b981;">Event Registration Confirmed!</h2>
      <p>Congratulations, you are successfully registered for <strong>${eventName}</strong>.</p>
      <p>Your ticket details are attached to this email. You can present the QR code at the entrance for direct scan-in.</p>
      <p>Ticket Number: <strong>${ticketNumber}</strong></p>
    </div>
  `;
  const attachments = [];
  if (pdfPath && pdfPath.startsWith('/') && !pdfPath.startsWith('http')) {
    attachments.push({
      filename: `ticket_${ticketNumber}.pdf`,
      path: pdfPath,
    });
  }
  await sendEmail({ to, subject: `Ticket Confirmation: ${eventName}`, html, attachments });
};

const sendEventReminder = async (to, eventTitle, timeRemaining) => {
  const html = `
    <div style="font-family: Poppins, sans-serif; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
      <h2 style="color: #f59e0b;">Event Reminder</h2>
      <p>This is a quick reminder that the event <strong>${eventTitle}</strong> is starting in <strong>${timeRemaining}</strong>.</p>
      <p>Please make sure to have your digital QR ticket ready at the venue.</p>
    </div>
  `;
  await sendEmail({ to, subject: `Reminder: ${eventTitle} starts in ${timeRemaining}`, html });
};

module.exports = {
  sendVerificationEmail,
  sendRegistrationTicket,
  sendEventReminder,
};
