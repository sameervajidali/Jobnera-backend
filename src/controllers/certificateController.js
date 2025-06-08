// controllers/certificateController.js
import Certificate from '../models/Certificate.js';
import { generateCertificateId } from '../utils/generateCertificateId.js';
import asyncHandler from '../utils/asyncHandler.js';

/**
 * Helper: Sanitize and format certificate for public/frontend
 * Add more fields as you add to schema (badge, signers, etc.)
 */
const sanitizeCertificate = (cert) => ({
  _id: cert._id,
  user: typeof cert.user === 'object'
    ? { _id: cert.user._id, name: cert.user.name, email: cert.user.email }
    : cert.user,
  title: cert.title,
  certificateId: cert.certificateId,
  score: cert.score,
  rawScore: cert.rawScore,
  totalQuestions: cert.totalQuestions,
  issueDate: cert.issueDate,
  expirationDate: cert.expirationDate,
  description: cert.description,
  issuer: cert.issuer,
  badgeUrl: cert.badgeUrl,
  quiz: cert.quiz?._id || cert.quiz,
  signers: cert.signers || [],
  issued: cert.issued,
  createdAt: cert.createdAt,
  updatedAt: cert.updatedAt
});

/**
 * Issue a Single Certificate (Admin or backend service)
 */
export const issueCertificate = asyncHandler(async (req, res) => {
  const {
    userId,
    title,
    score,
    rawScore,
    totalQuestions,
    location,
    signers,
    description,
    quiz,
    issuer = 'JobNeura',
    badgeUrl,
    issued,
    expirationDate
  } = req.body;

  if (!userId || !title)
    return res.status(400).json({ success: false, message: "User and title are required." });

  // Idempotency: prevent duplicate certificates per user/quiz/title
  const existing = await Certificate.findOne({ user: userId, title, quiz });
  if (existing)
    return res.status(409).json({ success: false, message: "Certificate already issued for this user/quiz.", certificate: sanitizeCertificate(existing) });

  const certificateId = await generateCertificateId("JN-QUIZ");
  const cert = await Certificate.create({
    user: userId,
    title,
    certificateId,
    score,
    rawScore,
    totalQuestions,
    location,
    signers,
    description,
    quiz,
    issuer,
    badgeUrl,
    issued,
    expirationDate
  });

  res.status(201).json({ success: true, certificate: sanitizeCertificate(cert) });
});

/**
 * Verify a Certificate (public/QR landing)
 */
export const verifyCertificate = asyncHandler(async (req, res) => {
  const { certificateId } = req.params;
  // .lean() for performance, add .populate('user', 'name email') if needed
  const cert = await Certificate.findOne({ certificateId }).lean();
  if (!cert)
    return res.status(404).json({ valid: false, message: "Certificate not found" });

  res.json({ valid: true, certificate: sanitizeCertificate(cert) });
});

/**
 * Bulk Issue Certificates (ADMIN)
 */
export const bulkIssueCertificates = asyncHandler(async (req, res) => {
  const { certificates } = req.body;
  if (!Array.isArray(certificates) || !certificates.length)
    return res.status(400).json({ success: false, message: "Certificates array required." });

  // Prevent duplicates, collect results
  const results = [];
  for (const certData of certificates) {
    const { user: userId, title, quiz } = certData;
    // Prevent duplicates for user/title/quiz combo
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

/**
 * Get All Certificates for Logged-in User (or admin: for any user)
 */
export const getUserCertificates = asyncHandler(async (req, res) => {
  let userId = req.user._id;
  // Optionally allow admin to specify user
  if (req.user.role === 'ADMIN' && req.query.user) {
    userId = req.query.user;
  }
  // You can add .populate('quiz', 'title') etc for richer response
  const certs = await Certificate.find({ user: userId }).sort({ issueDate: -1 });
  res.json({ certificates: certs.map(sanitizeCertificate) });
});

