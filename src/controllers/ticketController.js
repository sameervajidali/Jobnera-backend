
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
  console.log('getTicket id param:', req.params.id);
  const ticket = await Ticket.findById(req.params.id)
     .populate('user', 'name email')
    .populate('comments.by', 'name email');
  if (!ticket) return res.status(404).json({ message: 'Ticket not found' });
  res.json({ ticket });
});

// Update ticket status / priority
export const updateTicket = asyncHandler(async (req, res) => {
  console.log('⚙️  updateTicket id=', req.params.id, 'body=', req.body);

  // 1) Fetch the existing ticket
  const ticket = await Ticket.findById(req.params.id)
    .populate('user', 'name email')
    .populate('comments.by', 'name email');

  if (!ticket) {
    console.log('❌  Ticket not found in DB');
    return res.status(404).json({ message: 'Ticket not found' });
  }
  console.log('✅  Found ticket, current status=', ticket.status);

  // 2) Update fields
  if (req.body.status)   ticket.status   = req.body.status;
  if (req.body.priority) ticket.priority = req.body.priority;

  // 3) Save changes
  await ticket.save();
  console.log('🔄  Saved ticket, new status=', ticket.status);

  // 4) Return populated
  res.json({ ticket });
});

// Add a comment
export const addComment = asyncHandler(async (req, res) => {
  const { text } = req.body;
  const ticketId   = req.params.id;

  // 1) Fetch & populate the ticket
  const ticketDoc = await Ticket.findById(ticketId)
    .populate('user', 'name email')
    .populate('comments.by', 'name email');

  if (!ticketDoc) {
    return res.status(404).json({ message: 'Ticket not found' });
  }

  // 2) Push the new comment
  ticketDoc.comments.push({ by: req.user._id, text });

  // 3) Save the document
  await ticketDoc.save();

  // 4) Re-populate the comments array so `by.name`/`by.email` come through
  const updated = await Ticket.findById(ticketId)
    .populate('user', 'name email')
    .populate('comments.by', 'name email');

  // 5) Return it under the `ticket` key
  res.json({ ticket: updated });
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

