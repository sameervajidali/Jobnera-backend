
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import asyncHandler from '../utils/asyncHandler.js';

const cookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: 'None',
  path: '/',
};

const createAccessToken = (payload) =>
  jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '15m' });

const createRefreshToken = (payload) =>
  jwt.sign(payload, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });

export const handleGitHubCallback = asyncHandler(async (req, res) => {
  const clientOrigin = new URL(process.env.CLIENT_URL).origin;

  try {
    const githubUser = req.user;

    if (!githubUser || !githubUser.email) {
      return res.send(`
        <html>
          <body>
            <script>
              window.opener.postMessage(
                { success: false, error: "No email from GitHub" },
                "${clientOrigin}"
              );
              window.close();
            </script>
          </body>
        </html>
      `);
    }

    let user = await User.findOne({ email: githubUser.email });
    if (!user) {
      user = await User.create({
        name: githubUser.displayName || githubUser.username || 'GitHub User',
        email: githubUser.email,
        avatar: githubUser.photos?.[0]?.value || null,
        isVerified: true,
        provider: 'github',
      });
    }

    const accessToken = createAccessToken({ userId: user._id, role: user.role });
    const refreshToken = createRefreshToken({ userId: user._id });

    res
      .cookie('accessToken', accessToken, {
        ...cookieOptions,
        maxAge: 15 * 60 * 1000,
      })
      .cookie('refreshToken', refreshToken, {
        ...cookieOptions,
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

    res.send(`
      <html>
        <body>
          <script>
            window.opener.postMessage(
              { success: true },
              "${clientOrigin}"
            );
            window.close();
          </script>
        </body>
      </html>
    `);

  } catch (err) {
    console.error("GitHub callback error:", err);

    res.send(`
      <html>
        <body>
          <script>
            window.opener.postMessage(
              { success: false, error: "GitHub authentication failed" },
              "${clientOrigin}"
            );
            window.close();
          </script>
        </body>
      </html>
    `);
  }
});
