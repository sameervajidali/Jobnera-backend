import puppeteer from "puppeteer";
import Certificate from "../models/Certificate.js"; // or wherever your cert data comes from

export const generateOGImage = async (req, res) => {
  const { certificateId } = req.params;

  try {
    const cert = await Certificate.findOne({ certificateId });
    if (!cert) return res.status(404).send("Certificate not found");

    const browser = await puppeteer.launch({
      args: ["--no-sandbox", "--disable-setuid-sandbox"]
    });
    const page = await browser.newPage();

    // Generate a clean HTML layout for the certificate preview
    const html = `
      <html><body style="margin:0;padding:0;">
        <div style="font-family:sans-serif;text-align:center;padding:60px;background:#fff;border:2px solid #000;">
          <h1 style="font-size:36px;">Certificate of Excellence</h1>
          <p style="font-size:24px;">Awarded to</p>
          <h2 style="font-size:32px;font-weight:bold;">${cert.recipient}</h2>
          <p>For completing the <strong>${cert.title}</strong></p>
          <p style="margin-top:30px;">Date: ${new Date(cert.issueDate).toLocaleDateString("en-IN")}</p>
        </div>
      </body></html>
    `;

    await page.setContent(html);
    const buffer = await page.screenshot({ type: "png", fullPage: true });
    await browser.close();

    res.set("Content-Type", "image/png");
    res.send(buffer);
  } catch (err) {
    console.error(err);
    res.status(500).send("Failed to generate image");
  }
};
