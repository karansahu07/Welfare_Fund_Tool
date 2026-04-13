
import nodemailer from 'nodemailer';

export const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_FROM,
    pass: process.env.EMAIL_PASS?.replace(/\s/g, ''),
  },
});

export async function sendAccountEmail(to: string, password: string) {
  const info = await transporter.sendMail({
    from: `"Ekarigar Team" <${process.env.EMAIL_FROM}>`,
    to,
    subject: 'Welcome to Ekarigar - Your Account Details',
    html: `
      <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
        <h2 style="color: #2c3e50;">Welcome to <span style="color: #27ae60;">Ekarigar</span>!</h2>
        <p>Hello,</p>
        <p>We're excited to have you on board. Your employee account has been successfully created. Below are your login credentials:</p>
        <div style="background-color: #f9f9f9; padding: 15px; border-left: 4px solid #27ae60; margin: 15px 0;">
          <p><strong>Email:</strong> ${to}</p>
          <p><strong>Password:</strong> ${password}</p>
        </div>
        <p>If you have any questions or need help, feel free to reach out to our support team.</p>
        <p>Best regards,<br><strong>The Ekarigar Team</strong></p>
        <hr style="margin-top: 30px;">
        <small style="color: #777;">This is an automated message. Please do not reply directly to this email.</small>
      </div>
    `,
  });
  return info;
}

