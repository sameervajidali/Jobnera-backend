import express from "express";
import { generateOGImage } from "../controllers/ogController.js";

const router = express.Router();

router.get("/certificates/:certificateId/image", generateOGImage);

export default router;
