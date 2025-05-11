// src/routes/ticketRoutes.js
import express from 'express';
import { protect, requireRole } from '../middlewares/authMiddleware.js';
import {
  createTicket,
  listTickets,
  getTicket,
  updateTicket,
  addComment,
  closeTicket
} from '../controllers/ticketController.js';
import { validate } from '../validators/validate.js';
import {
  createTicketSchema,
  updateTicketSchema,
  commentSchema,
  idParamSchema
} from '../validators/ticketValidator.js';

const router = express.Router();

// Anyone logged in can open a ticket
router.post(
  '/ticket',
  protect,
   createTicket
);

// Admins/support can list & manage
router.get(
  '/admin/tickets',
  protect,
  requireRole(['ADMIN','SUPERADMIN','SUPPORT']),
  listTickets
);

// Fetch, update, comment
router.route('/admin/tickets/:id')
  .all(protect, requireRole(['ADMIN','SUPERADMIN','SUPPORT']), validate(idParamSchema, 'params'))
  .get(getTicket)
  .put(validate(updateTicketSchema), updateTicket);

router.post(
  '/admin/tickets/:id/comments',
  protect,
  requireRole(['ADMIN','SUPERADMIN','SUPPORT']),
  validate(commentSchema),
  addComment
);

router.post(
  '/admin/tickets/:id/close',
  protect,
  requireRole(['ADMIN','SUPERADMIN','SUPPORT']),
  validate(idParamSchema, 'params'),
  closeTicket
);

export default router;
