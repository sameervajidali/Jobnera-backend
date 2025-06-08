// Step 1: Create a new route file - routes/certificateOgRoutes.js
import express from 'express';
import puppeteer from 'puppeteer';

const router = express.Router();

/**
 * Dynamically generate an OG image from a certificate page
 * URL: /api/certificates/:id/og-image
 */
router.get('/:id/og-image', async (req, res) => {
  const { id } = req.params;
  const certUrl = `https://jobneura.tech/certificates/${id}`;

  try {
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const page = await browser.newPage();

    // Set viewport for OG image dimensions (Twitter/Facebook standard)
    await page.setViewport({ width: 1200, height: 630 });
    await page.goto(certUrl, { waitUntil: 'networkidle2' });

    // Target the certificate DOM element (ensure it exists)
    const certElement = await page.$('#certificate-preview, #certRef');
    if (!certElement) {
      await browser.close();
      return res.status(404).json({ error: 'Certificate element not found on page.' });
    }

    const imageBuffer = await certElement.screenshot({ type: 'png' });
    await browser.close();

    res.set('Content-Type', 'image/png');
    res.set('Cache-Control', 'public, max-age=604800'); // 7-day cache
    res.send(imageBuffer);
  } catch (err) {
    console.error('OG Image Generation Failed:', err);
    res.status(500).json({ error: 'Failed to generate OG image' });
  }
});

export default router;
