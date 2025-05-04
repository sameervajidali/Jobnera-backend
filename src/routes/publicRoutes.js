import express from 'express';
import { addToWaitlist } from '../controllers/publicController.js';

const router = express.Router();

router.post('/waitlist', addToWaitlist);

export default router;
