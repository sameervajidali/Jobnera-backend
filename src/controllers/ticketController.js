
// src/controllers/ticketController.js
import { sendTicketUpdateEmail, sendNewCommentEmail } from '../services/emailService.js';

import asyncHandler from '../utils/asyncHandler.js';
import Ticket from '../models/Ticket.js';

// Create a new ticket
export const createTicket = asyncHandler(async (req, res) => {
  const { subject, message, priority } = req.body;
  const ticket = await Ticket.create({
    user: req.user._id,
    subject,
    message,
    priority
  });
  res.status(201).json({ ticket });
});

// List tickets (optionally filter by status)
export const listTickets = asyncHandler(async (req, res) => {
  const { status, priority, page = 1, limit = 20 } = req.query;
  const filter = {};
  if (status)   filter.status = status;
  if (priority) filter.priority = priority;

  const skip = (page - 1) * limit;
  const [tickets, total] = await Promise.all([
    Ticket.find(filter)
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Ticket.countDocuments(filter)
  ]);

  res.json({ total, page: Number(page), limit: Number(limit), tickets });
});

// Get a single ticket
export const getTicket = asyncHandler(async (req, res) => {
  const ticket = await Ticket.findById(req.params.id)
    .populate('user', 'name email')
    .populate('comments.by', 'name email');
  if (!ticket) return res.status(404).json({ message: 'Ticket not found' });
  res.json({ ticket });
});

// Update ticket status / priority
export const updateTicket = asyncHandler(async (req, res) => {
  // … your existing update logic
  const ticket = await Ticket.findByIdAndUpdate(/* … */).populate('user','email name');
  if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

 // send email informing the user their ticket status changed
 await sendTicketUpdateEmail(ticket.user.email, {
   userName: ticket.user.name,
   subject: ticket.subject,
   newStatus: ticket.status,
   ticketId: ticket._id
 });

  res.json({ ticket });
});

// Add a comment
export const addComment = asyncHandler(async (req, res) => {
  // … your existing comment logic
  ticket.comments.push({ by: req.user._id, text: req.body.text });
  await ticket.save();
  const populated = await ticket.populate('comments.by', 'name email');

 // notify the ticket owner of the new comment
 await sendNewCommentEmail(populated.user.email, {
   userName: populated.user.name,
   commenterName: req.user.name,
   comment: req.body.text,
   ticketId: populated._id
 });

  res.json({ ticket: populated });
});
// Close (archive) a ticket
export const closeTicket = asyncHandler(async (req, res) => {
  const ticket = await Ticket.findByIdAndUpdate(
    req.params.id,
    { status: 'closed' },
    { new: true }
  );
  if (!ticket) return res.status(404).json({ message: 'Ticket not found' });
  res.json({ ticket });
});

