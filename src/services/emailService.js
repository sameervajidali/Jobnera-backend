// src/services/emailService.js
import dotenv from 'dotenv';
dotenv.config(); // ensure .env is loaded even if this file is imported early

import nodemailer from 'nodemailer';

// Debug: log SMTP env values to verify .env is loaded
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT),
  secure: false, // Use TLS (STARTTLS) on port 587
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export async function sendActivationEmail(to, name, activationLink) {
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f5f7fa; padding: 40px;">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.06);">
        <tr>
          <td style="padding: 30px; background: linear-gradient(90deg, #4a00e0, #8e2de2); color: white;">
            <h1 style="margin: 0; font-size: 24px;">🚀 Welcome to JobNeura</h1>
            <p style="margin: 8px 0 0;">Hi <strong>${name}</strong>, let's activate your account</p>
          </td>
        </tr>
        <tr>
          <td style="padding: 30px;">
            <p style="font-size: 16px; color: #444;">Thanks for signing up for <strong>JobNeura</strong> — your AI-powered career accelerator.</p>
            <p style="font-size: 16px; color: #444;">To get started, click the button below to activate your account and access smart resumes, personalized job matches, quizzes, and more.</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${activationLink}" style="background-color: #4a00e0; color: white; padding: 12px 24px; font-size: 16px; font-weight: bold; text-decoration: none; border-radius: 6px;">Activate My Account</a>
            </div>
            <p style="font-size: 14px; color: #888;">If you didn’t create this account, you can safely ignore this email.</p>
          </td>
        </tr>
        <tr>
          <td style="padding: 20px; text-align: center; background: #f0f0f5; font-size: 12px; color: #999;">
            <p style="margin: 0;">Need help? Contact support at <a href="mailto:support@jobneura.tech" style="color: #4a00e0;">support@jobneura.tech</a></p>
            <p style="margin: 5px 0 0;">© ${new Date().getFullYear()} JobNeura.tech. All rights reserved.</p>
          </td>
        </tr>
      </table>
    </div>
  `;

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject: 'Activate your JobNeura account',
    html,
  });
}

export async function sendResetPasswordEmail(to, name, resetLink) {
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f5f7fa; padding: 40px;">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.06);">
        <tr>
          <td style="padding: 30px; background: linear-gradient(90deg, #4a00e0, #8e2de2); color: white;">
            <h1 style="margin: 0; font-size: 24px;">🔐 Reset Your Password</h1>
            <p style="margin: 8px 0 0;">Hi <strong>${name}</strong>, follow the link below</p>
          </td>
        </tr>
        <tr>
          <td style="padding: 30px;">
            <p style="font-size: 16px; color: #444;">We received a request to reset your JobNeura account password. Click the button below to continue:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetLink}" style="background-color: #4a00e0; color: white; padding: 12px 24px; font-size: 16px; font-weight: bold; text-decoration: none; border-radius: 6px;">Reset Password</a>
            </div>
            <p style="font-size: 14px; color: #888;">If you didn’t request this, you can safely ignore this email.</p>
          </td>
        </tr>
        <tr>
          <td style="padding: 20px; text-align: center; background: #f0f0f5; font-size: 12px; color: #999;">
            <p style="margin: 0;">Need help? Contact support at <a href="mailto:support@jobneura.tech" style="color: #4a00e0;">support@jobneura.tech</a></p>
            <p style="margin: 5px 0 0;">© ${new Date().getFullYear()} JobNeura.tech. All rights reserved.</p>
          </td>
        </tr>
      </table>
    </div>
  `;

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject: 'Reset your JobNeura password',
    html,
  });
}

export async function sendUserCredentialsEmail(to, name, plainPassword) {
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f5f7fa; padding: 40px;">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.06);">
        <tr>
          <td style="padding: 30px; background: linear-gradient(90deg, #4a00e0, #8e2de2); color: white;">
            <h1 style="margin: 0; font-size: 24px;">👤 Your JobNeura Account</h1>
            <p style="margin: 8px 0 0;">Hi <strong>${name}</strong>, here are your login credentials</p>
          </td>
        </tr>
        <tr>
          <td style="padding: 30px;">
            <p style="font-size: 16px; color: #444;">An account has been created for you. Here are your login details:</p>
            <div style="background: #f0f0f5; padding: 20px; border-radius: 6px; margin: 20px 0;">
              <p><strong>Email:</strong> ${to}</p>
              <p><strong>Password:</strong> ${plainPassword}</p>
            </div>
            <p style="font-size: 16px; color: #444;">You can log in now and change your password from your profile settings:</p>
            <div style="text-align: center; margin-top: 20px;">
              <a href="${process.env.CLIENT_URL}/login" style="background-color: #4a00e0; color: white; padding: 12px 24px; font-size: 16px; font-weight: bold; text-decoration: none; border-radius: 6px;">Log In Now</a>
            </div>
          </td>
        </tr>
        <tr>
          <td style="padding: 20px; text-align: center; background: #f0f0f5; font-size: 12px; color: #999;">
            <p style="margin: 0;">Need help? Contact support at <a href="mailto:support@jobneura.tech" style="color: #4a00e0;">support@jobneura.tech</a></p>
            <p style="margin: 5px 0 0;">© ${new Date().getFullYear()} JobNeura.tech. All rights reserved.</p>
          </td>
        </tr>
      </table>
    </div>
  `;


  

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject: 'Your JobNeura.Tech Account Details',
    html,
  });
}


export async function sendPasswordChangedEmail(to, name) {
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f6f8; padding: 40px;">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.06);">
        <tr>
          <td style="padding: 30px; background: linear-gradient(90deg, #4a00e0, #8e2de2); color: white;">
            <h2 style="margin: 0; font-size: 24px;">🔒 Security Alert</h2>
          </td>
        </tr>
        <tr>
          <td style="padding: 30px;">
            <p style="font-size: 16px; color: #333;">Hi <strong>${name}</strong>,</p>
            <p style="font-size: 16px; color: #333;">
              We wanted to let you know that your password was recently changed on <strong>JobNeura</strong>.
            </p>
            <p style="font-size: 16px; color: #333;">
              If you made this change, no further action is needed.
            </p>
            <p style="font-size: 16px; color: #d9534f;">
              If you did <strong>not</strong> make this change, please reset your password immediately or contact our support team.
            </p>
            <div style="margin: 30px 0; text-align: center;">
              <a href="${process.env.CLIENT_URL}/forgot-password" style="background-color: #4a00e0; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                Reset Your Password
              </a>
            </div>
            <p style="font-size: 14px; color: #888;">This alert was sent for your protection.</p>
          </td>
        </tr>
        <tr>
          <td style="padding: 20px; text-align: center; background: #f0f0f5; font-size: 12px; color: #999;">
            <p style="margin: 0;">Need help? Contact <a href="mailto:support@jobneura.tech" style="color: #4a00e0;">support@jobneura.tech</a></p>
            <p style="margin: 5px 0 0;">© ${new Date().getFullYear()} JobNeura.tech. All rights reserved.</p>
          </td>
        </tr>
      </table>
    </div>
  `;

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject: '🔒 Your JobNeura password was changed',
    html,
  });
}


export async function sendActivationSuccessEmail(to, name) {
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f6f8; padding: 40px;">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.06);">
        <tr>
          <td style="padding: 30px; background: linear-gradient(90deg, #4a00e0, #8e2de2); color: white;">
            <h2 style="margin: 0; font-size: 22px;">🎉 Welcome to JobNeura</h2>
          </td>
        </tr>
        <tr>
          <td style="padding: 30px;">
            <p style="font-size: 16px; color: #333;">Hi <strong>${name}</strong>,</p>
            <p style="font-size: 16px; color: #333;">
              Your account has been successfully activated. You’re all set to explore the future of smart career growth with <strong>JobNeura</strong>.
            </p>
            <p style="font-size: 16px; color: #333;">Here’s what you can do next:</p>
            <ul style="font-size: 16px; color: #333; padding-left: 20px; margin-bottom: 24px;">
              <li>🚀 Build your AI-enhanced resume</li>
              <li>🧠 Test your skills with smart quizzes</li>
              <li>🎯 Match with ideal jobs automatically</li>
            </ul>
            <div style="text-align: center; margin-top: 30px;">
              <a href="${process.env.CLIENT_URL}/dashboard" style="background-color: #4a00e0; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                Go to Dashboard
              </a>
            </div>
            <p style="font-size: 14px; color: #888; margin-top: 30px;">
              Welcome aboard, and let’s build your future together 🚀
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding: 20px; text-align: center; background: #f0f0f5; font-size: 12px; color: #999;">
            <p style="margin: 0;">Need help? Contact <a href="mailto:support@jobneura.tech" style="color: #4a00e0;">support@jobneura.tech</a></p>
            <p style="margin: 5px 0 0;">© ${new Date().getFullYear()} JobNeura.tech. All rights reserved.</p>
          </td>
        </tr>
      </table>
    </div>
  `;

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject: "🎉 Your JobNeura Account is Activated!",
    html,
  });
}
