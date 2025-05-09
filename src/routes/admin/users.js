// src/routes/admin/users.js
import express from 'express';
import { getUserHistory } from '../../controllers/admin/userController.js';
// ... your existing imports

const router = express.Router();

// existing CRUD routes…
router.get('/:id/history', getUserHistory);

export default router;
