// src/controllers/ticketController.js
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
  const { status, priority } = req.body;
  const ticket = await Ticket.findByIdAndUpdate(
    req.params.id,
    { ...(status && { status }), ...(priority && { priority }) },
    { new: true }
  );
  if (!ticket) return res.status(404).json({ message: 'Ticket not found' });
  res.json({ ticket });
});

// Add a comment
export const addComment = asyncHandler(async (req, res) => {
  const { text } = req.body;
  const ticket = await Ticket.findById(req.params.id);
  if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

  ticket.comments.push({ by: req.user._id, text });
  await ticket.save();
  const populated = await ticket.populate('comments.by', 'name email');
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
