// File: backend/routes/ogImageRoutes.js
import express from "express";
import puppeteer from "puppeteer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const router = express.Router();

/**
 * GET /api/og/certificates/:certificateId
 * Dynamically renders certificate as PNG (OG-compatible)
 */
router.get("/certificates/:certificateId", async (req, res) => {
  const { certificateId } = req.params;

  // Construct full render URL (assumes /certificates/:id?og=true triggers clean layout)
  const fullURL = `${process.env.CLIENT_URL}/certificates/${certificateId}?og=true`;

  try {
    const browser = await puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();

    // Set fixed OG image viewport (e.g. 1200x630)
    await page.setViewport({ width: 1200, height: 630 });
    await page.goto(fullURL, { waitUntil: "networkidle2" });

    const imageBuffer = await page.screenshot({ type: "png" });
    await browser.close();

    res.set("Content-Type", "image/png");
    res.set("Cache-Control", "public, max-age=86400"); // 1 day
    res.send(imageBuffer);
  } catch (err) {
    console.error("OG render error:", err);
    res.status(500).json({ error: "Failed to generate OG image" });
  }
});

export default router;
