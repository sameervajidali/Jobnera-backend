// controllers/certificateController.js
import Certificate from '../models/Certificate.js';
import { generateCertificateId } from '../utils/generateCertificateId.js';

// Issue a new certificate
export const issueCertificate = async (req, res) => {
  try {
    // Auth middleware should check admin/service role before this
    const { userId, title, score, location, signers, description, quiz } = req.body;
    if (!userId || !title) return res.status(400).json({ success: false, message: "User and title required." });

    const certificateId = await generateCertificateId("JN-QUIZ");
    const cert = await Certificate.create({
      user: userId,
      title,
      certificateId,
      score,
      location,
      signers,
      description,
      quiz,
    });
    res.status(201).json({ success: true, certificate: cert });
  } catch (err) {
    if (err.code === 11000 && err.keyPattern?.certificateId) {
      return res.status(409).json({ success: false, message: "Certificate ID conflict, retry." });
    }
    res.status(500).json({ success: false, message: err.message });
  }
};

// Public: Verify a certificate (by certificateId)
export const verifyCertificate = async (req, res) => {
  try {
    const { certificateId } = req.params;
    const cert = await Certificate.findOne({ certificateId }).populate('user quiz');
    if (!cert) return res.status(404).send('<h1>Certificate Not Found</h1>');
    // Render simple page (for QR) — replace with React SSR/Next.js if desired
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
          <p><b>Date:</b> ${cert.issueDate.toLocaleDateString()}</p>
          <p><b>Certificate ID:</b> ${cert.certificateId}</p>
          <hr>
          <p>Status: <span style="color:green">VALID</span></p>
          <p><a href="https://jobneura.tech">Back to JobNeura</a></p>
        </body>
      </html>
    `);
  } catch (err) {
    res.status(500).send("<h1>Error verifying certificate</h1>");
  }
};



// controllers/certificateController.js

// ...existing code...

// BULK Certificate Issuance
export const bulkIssueCertificates = async (req, res) => {
  try {
    // Accepts array of { userId, title, score, etc. }
    const { certificates } = req.body;
    if (!Array.isArray(certificates) || !certificates.length) {
      return res.status(400).json({ success: false, message: "Certificates array required." });
    }
    const results = [];
    for (const certData of certificates) {
      const certificateId = await generateCertificateId("JN-QUIZ");
      const cert = await Certificate.create({ ...certData, certificateId });
      results.push(cert);
    }
    res.status(201).json({ success: true, count: results.length, certificates: results });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

