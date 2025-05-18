
// import jwt from 'jsonwebtoken';
// import User from '../models/User.js';
// import Role from '../models/Role.js';
// import asyncHandler from '../utils/asyncHandler.js';

// const cookieOptions = {
//   httpOnly: true,
//   secure: true,
//   sameSite: 'None',
//   path: '/',
// };

// const createAccessToken = (payload) =>
//   jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '15m' });

// const createRefreshToken = (payload) =>
//   jwt.sign(payload, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });

// export const handleGitHubCallback = asyncHandler(async (req, res) => {
//   const clientOrigin = new URL(process.env.CLIENT_URL).origin;

//   try {
//     const githubUser = req.user;

//     if (!githubUser || !githubUser.email) {
//       return res.send(`
//         <html>
//           <body>
//             <script>
//               window.opener.postMessage(
//                 { success: false, error: "No email from GitHub" },
//                 "${clientOrigin}"
//               );
//               window.close();
//             </script>
//           </body>
//         </html>
//       `);
//     }

//     let user = await User.findOne({ email: githubUser.email });
//     if (!user) {
//       user = await User.create({
//         name: githubUser.displayName || githubUser.username || 'GitHub User',
//         email: githubUser.email,
//         avatar: githubUser.photos?.[0]?.value || null,
//         isVerified: true,
//         provider: 'github',
//          role:       userRole._id,    // 🔑 assign the role
//       });
//     }

//     const accessToken = createAccessToken({ userId: user._id, role: user.role });
//     const refreshToken = createRefreshToken({ userId: user._id });

//     res
//       .cookie('accessToken', accessToken, {
//         ...cookieOptions,
//         maxAge: 15 * 60 * 1000,
//       })
//       .cookie('refreshToken', refreshToken, {
//         ...cookieOptions,
//         maxAge: 7 * 24 * 60 * 60 * 1000,
//       });

//     res.send(`
//       <html>
//         <body>
//           <script>
//             window.opener.postMessage(
//               { success: true },
//               "${clientOrigin}"
//             );
//             window.close();
//           </script>
//         </body>
//       </html>
//     `);

//   } catch (err) {
//     console.error("GitHub callback error:", err);

//     res.send(`
//       <html>
//         <body>
//           <script>
//             window.opener.postMessage(
//               { success: false, error: "GitHub authentication failed" },
//               "${clientOrigin}"
//             );
//             window.close();
//           </script>
//         </body>
//       </html>
//     `);
//   }
// });


import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Role from '../models/Role.js';
import asyncHandler from '../utils/asyncHandler.js';

const cookieOptions = {
 
  domain:   '.jobneura.tech',   // ← allow jobneura.tech & api.jobneura.tech
  path:     '/',
  httpOnly: true,
  secure:   process.env.NODE_ENV === 'production',
  sameSite: 'None',
};

const createAccessToken = payload =>
  jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '15m' });

const createRefreshToken = payload =>
  jwt.sign(payload, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });

export const handleGitHubCallback = asyncHandler(async (req, res) => {
  const clientOrigin = new URL(process.env.CLIENT_URL).origin;

  try {
    const githubUser = req.user;
    if (!githubUser?.email) {
      return res.send(`
        <script>
          window.opener.postMessage(
            { success: false, error: "No email from GitHub" },
            "${clientOrigin}"
          );
          window.close();
        </script>
      `);
    }

    // ─── FIND OR CREATE USER WITH ROLE ─────────────────────────
    let user = await User.findOne({ email: githubUser.email });
    if (!user) {
      // lookup default USER role
      const defaultRole = await Role.findOne({ name: 'USER' });
      if (!defaultRole) {
        throw new Error('Default USER role not found');
      }

      user = await User.create({
        name:       githubUser.displayName || githubUser.username || 'GitHub User',
        email:      githubUser.email,
        avatar:     githubUser.photos?.[0]?.value || null,
        isVerified: true,
        provider:   'github',
        role:       defaultRole._id,    // ← assign the role ID
      });
    }

    // ─── ISSUE TOKENS & SET COOKIES ───────────────────────────
    const accessToken  = createAccessToken({ userId: user._id, role: user.role });
    const refreshToken = createRefreshToken({ userId: user._id });

    res
      .cookie('accessToken',  accessToken,  { ...cookieOptions, maxAge:  15 * 60 * 1000 })
      .cookie('refreshToken', refreshToken, { ...cookieOptions, maxAge: 7  * 24 * 60 * 60 * 1000 });

    // ─── NOTIFY OPENER & CLOSE POPUP ──────────────────────────
    res.send(`
      <script>
        window.opener.postMessage({ success: true }, "${clientOrigin}");
        window.close();
      </script>
    `);

  } catch (err) {
    console.error('GitHub callback error:', err);
    res.send(`
      <script>
        window.opener.postMessage(
          { success: false, error: "${err.message}" },
          "${clientOrigin}"
        );
        window.close();
      </script>
    `);
  }
});
