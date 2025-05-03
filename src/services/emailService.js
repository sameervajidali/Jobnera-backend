
// // backend/utils/emailService.js
// import nodemailer from 'nodemailer';

// // Create test Ethereal account automatically
// let testAccount = await nodemailer.createTestAccount();

// const transporter = nodemailer.createTransport({
//   host: 'smtp.ethereal.email',
//   port: 587,
//   auth: {
//     user: testAccount.user,
//     pass: testAccount.pass,
//   },
// });

// export const sendActivationEmail = async (to, name, activationLink) => {
//   const mailOptions = {
//     from: `JobNeura <${testAccount.user}>`,
//     to,
//     subject: 'Activate your JobNeura account',
//     html: `
//       <div style="font-family:sans-serif; background:#f9f9f9; padding:30px;">
//         <h2 style="color:#4a00e0;">Welcome, ${name}!</h2>
//         <p>Thanks for signing up. Please activate your account:</p>
//         <a href="${activationLink}" style="padding:10px 20px; background:#4a00e0; color:#fff; text-decoration:none; border-radius:5px;">Activate Now</a>
//         <p style="margin-top:20px; font-size:12px; color:#888;">If you didn't sign up, you can safely ignore this email.</p>
//       </div>
//     `,
//   };

//   const info = await transporter.sendMail(mailOptions);

//   console.log("✅ Activation email sent:", nodemailer.getTestMessageUrl(info));
// };


// src/services/emailService.js
import nodemailer from 'nodemailer';

// Initialize transporter once
let transporterPromise = (async () => {
  // Create a test account (Ethereal)
  const testAccount = await nodemailer.createTestAccount();
  return nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });
})();

/**
 * Send account activation email via Ethereal
 * @param {string} to - Recipient email
 * @param {string} name - Recipient name
 * @param {string} activationLink - Activation URL
 */
export async function sendActivationEmail(to, name, activationLink) {
  const transporter = await transporterPromise;
  const mailOptions = {
    from: `JobNeura <no-reply@jobneura.tech>`,
    to,
    subject: 'Activate your JobNeura account',
    html: `
      <div style="font-family:sans-serif; background:#f9f9f9; padding:30px;">
        <h2 style="color:#4a00e0;">Welcome, ${name}!</h2>
        <p>Thanks for signing up. Please activate your account:</p>
        <a href="${activationLink}" style="padding:10px 20px; background:#4a00e0; color:#fff; text-decoration:none; border-radius:5px;">Activate Now</a>
        <p style="margin-top:20px; font-size:12px; color:#888;">If you didn't sign up, you can safely ignore this email.</p>
      </div>
    `,
  };

  const info = await transporter.sendMail(mailOptions);
  console.log('✅ Activation email sent:', nodemailer.getTestMessageUrl(info));
}

/**
 * Send password reset email via Ethereal
 * @param {string} to - Recipient email
 * @param {string} name - Recipient name
 * @param {string} resetLink - Password reset URL
 */
export async function sendResetPasswordEmail(to, name, resetLink) {
  const transporter = await transporterPromise;
  const mailOptions = {
    from: `JobNeura <no-reply@jobneura.tech>`,
    to,
    subject: 'Reset your JobNeura password',
    html: `
      <div style="font-family:sans-serif; background:#f9f9f9; padding:30px;">
        <h2 style="color:#4a00e0;">Hello, ${name}</h2>
        <p>You requested a password reset. Click the link below (valid for 1 hour):</p>
        <a href="${resetLink}" style="padding:10px 20px; background:#4a00e0; color:#fff; text-decoration:none; border-radius:5px;">Reset Password</a>
        <p style="margin-top:20px; font-size:12px; color:#888;">If you didn't request this, you can ignore this email.</p>
      </div>
    `,
  };

  const info = await transporter.sendMail(mailOptions);
  console.log('✅ Reset email sent:', nodemailer.getTestMessageUrl(info));
}

/**
 * Send a welcome email containing the user’s credentials.
 */
export async function sendUserCredentialsEmail(to, name, plainPassword) {
  const transporter = await transporterPromise;
  const html = `
    <h2>Hello ${name},</h2>
    <p>An account has been created for you on JobNeura.Tech.</p>
    <p><strong>Email:</strong> ${to}<br/>
       <strong>Password:</strong> ${plainPassword}</p>
    <p>Please <a href="${process.env.CLIENT_URL}/login">log in</a> and change your password immediately.</p>
  `;
  const info = await transporter.sendMail({
    from: process.env.EMAIL_FROM || 'no-reply@jobneura.tech',
    to,
    subject: 'Your JobNeura.Tech Account Details',
    html,
  });
  console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
}
