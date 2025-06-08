import puppeteer from 'puppeteer';
import asyncHandler from '../utils/asyncHandler.js';
import Certificate from '../models/Certificate.js';

export const generateCertificateOgImage = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const cert = await Certificate.findOne({ certificateId: id }).populate('user', 'name');
  if (!cert) {
    return res.status(404).json({ message: `Certificate not found: ${id}` });
  }

  const ogUrl = `${process.env.FRONTEND_URL || "https://jobneura.tech"}/certificates/${id}?og=1`;

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 630 });
  await page.goto(ogUrl, { waitUntil: 'networkidle0' });

  const screenshot = await page.screenshot({ type: 'png' });
  await browser.close();

  res.setHeader('Content-Type', 'image/png');
  res.setHeader('Cache-Control', 'public, max-age=86400'); // 1 day cache
  return res.end(screenshot);
});
