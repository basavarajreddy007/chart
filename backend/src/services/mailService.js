const nodemailer = require('nodemailer');
const logger = require('../config/logger');

const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_PORT === '465',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

const sendOTPEmail = async (email, otp) => {
  const smtpUser = process.env.SMTP_USER;
  const isMock = !smtpUser || smtpUser === 'mock' || smtpUser === 'your_smtp_user';

  if (isMock) {
    logger.info(`[MAIL SIMULATION] OTP for ${email}: ${otp}`);
    return;
  }

  const transporter = createTransporter();

  const mailOptions = {
    from: `"Nebula Chat" <${process.env.EMAIL_FROM || process.env.SMTP_USER}>`,
    to: email,
    subject: 'Your Nebula Chat Verification Code',
    text: `Your verification code is: ${otp}\n\nThis code expires in 15 minutes.`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;background:#0f172a;color:#e2e8f0;border-radius:12px;">
        <h2 style="color:#818cf8;margin-bottom:8px;">Nebula Chat</h2>
        <p style="color:#94a3b8;margin-bottom:24px;">Email Verification</p>
        <p>Use the code below to verify your email address:</p>
        <div style="font-size:36px;font-weight:bold;letter-spacing:8px;text-align:center;padding:24px;background:#1e293b;border-radius:8px;color:#a5b4fc;margin:24px 0;">
          ${otp}
        </div>
        <p style="color:#64748b;font-size:14px;">This code expires in <strong>15 minutes</strong>. If you didn't request this, you can ignore this email.</p>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    logger.info(`[MAIL] OTP sent to ${email} — Message ID: ${info.messageId}`);
  } catch (error) {
    logger.error(`[MAIL] Failed to send OTP to ${email}: ${error.message}`);
    // Log fallback so dev can still test without email
    logger.info(`[MAIL FALLBACK] OTP for ${email}: ${otp}`);
  }
};

module.exports = sendOTPEmail;
