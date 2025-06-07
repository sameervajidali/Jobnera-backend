// // src/routes/admin/topicRoutes.js
// import express from 'express';
// import multer from 'multer';
// import { protect, requireRole } from '../../middlewares/authMiddleware.js';
// import {
//   getAllTopics,
//   getTopicById,
//   createTopic,
//   updateTopic,
//   deleteTopic,
//   bulkUploadTopics, // ✅ Add this controller
// } from '../../controllers/admin/topicController.js';

// const router = express.Router();
// const upload = multer(); // for handling multipart/form-data

// // Protect all topic routes
// router.use(protect, requireRole('SUPERADMIN', 'ADMIN'));

// // ─────────────────────────────────────────────
// // GET all + CREATE new
// router.route('/')
//   .get(getAllTopics)
//   .post(createTopic);

// // ─────────────────────────────────────────────
// // GET, UPDATE, DELETE by ID
// router.route('/:id')
//   .get(getTopicById)
//   .put(updateTopic)
//   .delete(deleteTopic);

// // ─────────────────────────────────────────────
// // ✅ BULK UPLOAD route — CSV/XLSX
// router.post('/bulk-upload', upload.single('file'), bulkUploadTopics);
// router.post('/bulk-upload/json', requireRole('ADMIN'), upload.none(), bulkUploadTopicsJSON);
// router.post('/bulk-upload/csv', requireRole('ADMIN'), upload.single('file'), bulkUploadTopicsCSV);


// export default router;

// src/routes/admin/topicRoutes.js
import express from 'express';
import multer from 'multer';
import { protect, requireRole } from '../../middlewares/authMiddleware.js';
import {
  getAllTopics,
  getTopicById,
  createTopic,
  updateTopic,
  deleteTopic,
  toggleTopicVisibility,
  bulkUploadTopics,
  bulkUploadTopicsJSON,
  bulkUploadTopicsCSV
} from '../../controllers/admin/topicController.js';

const router = express.Router();
const upload = multer(); // for handling multipart/form-data

// ───────────────────────────────
// Auth & Role Protection (all routes below require login + role)
router.use(protect);
router.use(requireRole('SUPERADMIN', 'ADMIN'));

// ────────────── CRUD ──────────────
// GET all topics & CREATE new topic
router.route('/')
  .get(getAllTopics)
  .post(createTopic);

// GET / PUT / DELETE / PATCH visibility by ID
router.route('/:id')
  .get(getTopicById)
  .put(updateTopic)
  .delete(deleteTopic);

// PATCH toggle visibility (optional utility)
router.patch('/:id/toggle', toggleTopicVisibility);

// ─────────── BULK UPLOADS ───────────
// CSV/XLSX via file upload (FormData: file + [category])
router.post('/bulk-upload', upload.single('file'), bulkUploadTopics);

// Robust CSV/XLSX with error reporting (category from FormData or file)
router.post('/bulk-upload/csv', upload.single('file'), bulkUploadTopicsCSV);

// JSON array upload (content-type: application/json)
router.post('/bulk-upload/json', upload.none(), bulkUploadTopicsJSON);

export default router;
