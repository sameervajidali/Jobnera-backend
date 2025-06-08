import Certificate from '../models/Certificate.js';
import { generateCertificateId } from '../utils/generateCertificateId.js';
import asyncHandler from '../utils/asyncHandler.js';

// === Helper: Filter only public certificate fields for response ===
const sanitizeCertificate = (cert) => ({
  _id: cert._id,
  user: typeof cert.user === 'object' ? { _id: cert.user._id, name: cert.user.name, email: cert.user.email } : cert.user,
  title: cert.title,
  certificateId: cert.certificateId,
  score: cert.score,
  issueDate: cert.issueDate,
  description: cert.description,
  issuer: cert.issuer,
  badgeUrl: cert.badgeUrl,
  quiz: cert.quiz?._id || cert.quiz, // could populate more
  createdAt: cert.createdAt,
  updatedAt: cert.updatedAt
});

// === Issue a Single Certificate (ADMIN) ===
export const issueCertificate = asyncHandler(async (req, res) => {
  const { userId, title, score, location, signers, description, quiz } = req.body;
  if (!userId || !title) return res.status(400).json({ success: false, message: "User and title are required." });

  // Prevent issuing duplicate certificate for same quiz/user (idempotency)
  const existing = await Certificate.findOne({ user: userId, title, quiz });
  if (existing) return res.status(409).json({ success: false, message: "Certificate already issued for this user/quiz." });

  const certificateId = await generateCertificateId("JN-QUIZ");
  const cert = await Certificate.create({
    user: userId,
    title,
    certificateId,
    score,
    location,
    signers,
    description,
    quiz
  });
  res.status(201).json({ success: true, certificate: sanitizeCertificate(cert) });
});

// === Public: Verify a Certificate (by certificateId, QR Landing) ===
export const verifyCertificate = asyncHandler(async (req, res) => {
  const { certificateId } = req.params;
  const cert = await Certificate.findOne({ certificateId: req.params.id }).populate('user', 'name').populate('quiz', 'title');
  if (!cert) {
    return res.status(404).send('<h1>Certificate Not Found</h1>');
  }

  // (SSR/HTML for QR landing; for API, send JSON instead)
  res.send(`
    <html>
      <head>
        <title>Certificate Verification | JobNeura</title>
        <style>
          body { font-family: Inter, Arial, sans-serif; background: #f7f8fa; text-align: center; padding: 2em;}
          .verified { color: #22c55e; font-size: 2.1em; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="verified">Certificate Verified ✅</div>
        <p><b>Name:</b> ${cert.user?.name || "User"}</p>
        <p><b>Certificate:</b> ${cert.title}</p>
        <p><b>Score:</b> ${cert.score ?? "--"}</p>
        <p><b>Date:</b> ${cert.issueDate?.toLocaleDateString?.() ?? "--"}</p>
        <p><b>Certificate ID:</b> ${cert.certificateId}</p>
        <hr>
        <p>Status: <span style="color:green">VALID</span></p>
        <p><a href="https://jobneura.tech">Back to JobNeura</a></p>
      </body>
    </html>
  `);
});

// === Bulk Issue Certificates (ADMIN) ===
export const bulkIssueCertificates = asyncHandler(async (req, res) => {
  const { certificates } = req.body;
  if (!Array.isArray(certificates) || !certificates.length) {
    return res.status(400).json({ success: false, message: "Certificates array required." });
  }
  // Prevent duplicate issuance in bulk (by user/title/quiz)
  const results = [];
  for (const certData of certificates) {
    const { user: userId, title, quiz } = certData;
    const exists = await Certificate.findOne({ user: userId, title, quiz });
    if (exists) {
      results.push({ ...sanitizeCertificate(exists), duplicate: true });
      continue;
    }
    const certificateId = await generateCertificateId("JN-QUIZ");
    const cert = await Certificate.create({ ...certData, certificateId });
    results.push(sanitizeCertificate(cert));
  }
  res.status(201).json({ success: true, count: results.length, certificates: results });
});

// === Get All Certificates for Logged-in User ===
export const getUserCertificates = asyncHandler(async (req, res) => {
  // Allow admin to query by userId (optional: you can lock this down for only self)
  let userId = req.user._id;
  if (req.user.role === 'ADMIN' && req.query.user) {
    userId = req.query.user;
  }
  const certs = await Certificate.find({ user: userId }).sort({ issueDate: -1 });
  res.json({ certificates: certs.map(sanitizeCertificate) });
});
