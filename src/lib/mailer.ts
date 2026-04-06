import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.ethereal.email',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

interface ExpiryNotificationParams {
  to: string;
  userName: string;
  documentTitle: string;
  documentType: string;
  daysLeft: number;
  expiryDate: Date;
  extendedOffer?: {
    price: number;
    durationDays: number;
  };
}

export async function sendExpiryNotification({
  to,
  userName,
  documentTitle,
  documentType,
  daysLeft,
  expiryDate,
  extendedOffer,
}: ExpiryNotificationParams) {
  const urgency = daysLeft <= 1 ? '🔴 URGENT' : '⚠️ Reminder';
  const subject = `${urgency}: Your ${documentType.toLowerCase()} "${documentTitle}" expires in ${daysLeft} day${daysLeft > 1 ? 's' : ''}`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #0a0a1a; font-family: 'Inter', Arial, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <!-- Header -->
    <div style="text-align: center; margin-bottom: 32px;">
      <div style="display: inline-block; background: linear-gradient(135deg, #6366f1, #4f46e5); padding: 12px; border-radius: 12px; margin-bottom: 12px;">
        <span style="color: white; font-size: 24px;">🔒</span>
      </div>
      <h1 style="color: #f1f5f9; margin: 0; font-size: 24px; font-weight: 700;">DigiWarr Vault</h1>
    </div>

    <!-- Main Content -->
    <div style="background: #111127; border: 1px solid #1e293b; border-radius: 16px; padding: 32px; margin-bottom: 24px;">
      <h2 style="color: ${daysLeft <= 1 ? '#ef4444' : '#f59e0b'}; margin: 0 0 8px 0; font-size: 18px;">
        ${urgency}: Document Expiring Soon
      </h2>
      <p style="color: #94a3b8; margin: 0 0 24px 0; font-size: 14px;">
        Hi ${userName || 'there'}, one of your documents is about to expire.
      </p>

      <div style="background: #1a1a3e; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; color: #64748b; font-size: 13px;">Document</td>
            <td style="padding: 8px 0; color: #f1f5f9; font-size: 13px; text-align: right; font-weight: 600;">${documentTitle}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #64748b; font-size: 13px;">Type</td>
            <td style="padding: 8px 0; color: #f1f5f9; font-size: 13px; text-align: right; text-transform: capitalize;">${documentType.toLowerCase()}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #64748b; font-size: 13px;">Expires On</td>
            <td style="padding: 8px 0; color: ${daysLeft <= 1 ? '#ef4444' : '#f59e0b'}; font-size: 13px; text-align: right; font-weight: 600;">
              ${expiryDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #64748b; font-size: 13px;">Days Left</td>
            <td style="padding: 8px 0; color: ${daysLeft <= 1 ? '#ef4444' : '#f59e0b'}; font-size: 16px; text-align: right; font-weight: 700;">${daysLeft} day${daysLeft > 1 ? 's' : ''}</td>
          </tr>
        </table>
      </div>

      ${extendedOffer ? `
      <div style="background: linear-gradient(135deg, #10b981, #059669); border-radius: 12px; padding: 20px; margin-bottom: 24px;">
        <h3 style="color: white; margin: 0 0 8px 0; font-size: 16px;">Extend your warranty!</h3>
        <p style="color: #d1fae5; margin: 0 0 16px 0; font-size: 14px;">
          Your shopkeeper has offered an extended warranty of ${extendedOffer.durationDays} days for ₹${extendedOffer.price}.
        </p>
        <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/dashboard" 
           style="display: inline-block; background: white; color: #059669; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 13px;">
          Buy Extension
        </a>
      </div>
      ` : ''}

      <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/dashboard" 
         style="display: block; text-align: center; background: linear-gradient(135deg, #4f46e5, #6366f1); color: white; padding: 14px 24px; border-radius: 12px; text-decoration: none; font-weight: 600; font-size: 14px;">
        View in Dashboard →
      </a>
    </div>

    <!-- Footer -->
    <div style="text-align: center; color: #64748b; font-size: 12px;">
      <p style="margin: 0 0 8px 0;">🔐 Secured with AES-256-GCM · Zero-Trust Architecture</p>
      <p style="margin: 0;">© ${new Date().getFullYear()} DigiWarr Vault. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `;

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || 'noreply@digiwarr.com',
      to,
      subject,
      html,
    });
    return true;
  } catch (error) {
    console.error(`Failed to send email to ${to}:`, error);
    return false;
  }
}

export async function sendExtendedWarrantyConfirmation(to: string, userName: string, documentTitle: string, extendedExpiryDate: Date) {
  const subject = `Confirmed: Extended Warranty for "${documentTitle}"`;
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
</head>
<body style="background-color: #0a0a1a; color: #f1f5f9; font-family: 'Inter', sans-serif; padding: 40px 20px;">
  <div style="max-width: 600px; margin: 0 auto; background: #111127; padding: 32px; border-radius: 16px;">
    <h2 style="color: #10b981;">Extended Warranty Confirmed!</h2>
    <p>Hi ${userName},</p>
    <p>Your extended warranty for <strong>${documentTitle}</strong> has been successfully activated.</p>
    <p>Your new expiry date is: <strong>${extendedExpiryDate.toLocaleDateString()}</strong></p>
    <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/dashboard" style="display: inline-block; background: #6366f1; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin-top: 20px;">View Warranty</a>
  </div>
</body>
</html>
  `;
  try {
    if (!process.env.SMTP_USER) return true;
    await transporter.sendMail({ from: process.env.SMTP_FROM || 'noreply@digiwarr.com', to, subject, html });
    return true;
  } catch (error) {
    console.error(`Failed to send extended warranty confirmation to ${to}:`, error);
    return false;
  }
}

export async function sendVerificationEmail(to: string, token: string) {
  const resetLink = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/verify-email?token=${token}`;
  const subject = `Welcome to DigiWarr - Verify your email`;
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
</head>
<body style="background-color: #0a0a1a; color: #f1f5f9; font-family: 'Inter', sans-serif; padding: 40px 20px;">
  <div style="max-width: 600px; margin: 0 auto; background: #111127; padding: 32px; border-radius: 16px;">
    <h2 style="color: #6366f1;">Verify your email address</h2>
    <p>Thanks for signing up for DigiWarr! Please click the button below to verify your email address and activate your account.</p>
    <a href="${resetLink}" style="display: inline-block; background: #6366f1; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin-top: 20px;">Verify Email</a>
    <p style="margin-top: 20px; font-size: 12px; color: #64748b;">If you didn't create an account, you can safely ignore this email.</p>
  </div>
</body>
</html>
  `;
  try {
    if (!process.env.SMTP_USER) {
      console.log('\n=============================================');
      console.log(`DEVELOPMENT MODE: Email not sent (SMTP not configured)`);
      console.log(`To: ${to}`);
      console.log(`Subject: ${subject}`);
      console.log(`Link: ${resetLink}`);
      console.log('=============================================\n');
      return true;
    }

    await transporter.sendMail({
      from: process.env.SMTP_FROM || 'noreply@digiwarr.com',
      to,
      subject,
      html,
    });
    return true;
  } catch (error) {
    console.error(`Failed to send verification email to ${to}:`, error);
    return false;
  }
}

export async function sendPasswordResetEmail(to: string, token: string) {
  const resetLink = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/reset-password?token=${token}`;
  const subject = `Reset your DigiWarr password`;
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
</head>
<body style="background-color: #0a0a1a; color: #f1f5f9; font-family: 'Inter', sans-serif; padding: 40px 20px;">
  <div style="max-width: 600px; margin: 0 auto; background: #111127; padding: 32px; border-radius: 16px;">
    <h2 style="color: #6366f1;">Reset your password</h2>
    <p>We received a request to reset your password. Click the button below to choose a new one:</p>
    <a href="${resetLink}" style="display: inline-block; background: #6366f1; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin-top: 20px;">Reset Password</a>
    <p style="margin-top: 20px; font-size: 12px; color: #64748b;">If you didn't request a password reset, you can safely ignore this email. The link will expire in 1 hour.</p>
  </div>
</body>
</html>
  `;
  try {
    if (!process.env.SMTP_USER) {
      console.log('\n=============================================');
      console.log(`DEVELOPMENT MODE: Email not sent (SMTP not configured)`);
      console.log(`To: ${to}`);
      console.log(`Subject: ${subject}`);
      console.log(`Link: ${resetLink}`);
      console.log('=============================================\n');
      return true;
    }

    await transporter.sendMail({
      from: process.env.SMTP_FROM || 'noreply@digiwarr.com',
      to,
      subject,
      html,
    });
    return true;
  } catch (error) {
    console.error(`Failed to send password reset email to ${to}:`, error);
    return false;
  }
}
