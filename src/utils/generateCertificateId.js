// utils/generateCertificateId.js
import CertificateCounter from '../models/CertificateCounter.js';

export async function generateCertificateId(prefix = "JN-QUIZ") {
  const today = new Date();
  const dateStr = today.toISOString().slice(0,10).replace(/-/g, ""); // "20250608"
  // Find or create counter doc
  const counter = await CertificateCounter.findOneAndUpdate(
    { date: dateStr },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  const seqStr = String(counter.seq).padStart(4, "0");
  return `${prefix}-${dateStr}-${seqStr}`;
}