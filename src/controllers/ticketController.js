
// // src/controllers/ticketController.js
// import { sendTicketUpdateEmail, sendNewCommentEmail } from '../services/emailService.js';

// import asyncHandler from '../utils/asyncHandler.js';
// import Ticket from '../models/Ticket.js';

// // Create a new ticket
// export const createTicket = asyncHandler(async (req, res) => {
//   const { subject, message, priority } = req.body;
//   const ticket = await Ticket.create({
//     user: req.user._id,
//     subject,
//     message,
//     priority
//   });
//   res.status(201).json({ ticket });
// });

// // List tickets (optionally filter by status)
// export const listTickets = asyncHandler(async (req, res) => {
//   const { status, priority, page = 1, limit = 20 } = req.query;
//   const filter = {};
//   if (status) filter.status = status;
//   if (priority) filter.priority = priority;

//   const skip = (page - 1) * limit;
//   const [tickets, total] = await Promise.all([
//     Ticket.find(filter)
//       .populate('user', 'name email')
//       .sort({ createdAt: -1 })
//       .skip(skip)
//       .limit(Number(limit)),
//     Ticket.countDocuments(filter)
//   ]);

//   res.json({ total, page: Number(page), limit: Number(limit), tickets });
// });

// // Get a single ticket
// export const getTicket = asyncHandler(async (req, res) => {
//   console.log('getTicket id param:', req.params.id);
//   const ticket = await Ticket.findById(req.params.id)
//     .populate('user', 'name email')
//     .populate('comments.by', 'name email');
//   if (!ticket) return res.status(404).json({ message: 'Ticket not found' });
//   res.json({ ticket });
// });

// // Update ticket status / priority
// export const updateTicket = asyncHandler(async (req, res) => {
//   console.log('⚙️  updateTicket id =', req.params.id, 'body =', req.body);

//   // 1) Fetch the existing ticket
//   const ticket = await Ticket.findById(req.params.id)
//     .populate('user', 'name email')
//     .populate('comments.by', 'name email');

//   if (!ticket) {
//     console.log('❌  Ticket not found in DB');
//     return res.status(404).json({ message: 'Ticket not found' });
//   }

//   console.log('✅  Found ticket, current status =', ticket.status);

//   // 2) Update fields if provided
//   if (req.body.status) ticket.status = req.body.status;
//   if (req.body.priority) ticket.priority = req.body.priority;

//   // Optional: Add comment or reply if `text` is provided
//   const { text, parentId } = req.body;
//   if (text) {
//     if (parentId) {
//       const parent = ticket.comments.id(parentId);
//       if (!parent) {
//         return res.status(400).json({ message: 'Parent comment not found' });
//       }
//       parent.replies.push({ by: req.user._id, text });
//     } else {
//       ticket.comments.push({ by: req.user._id, text });
//     }
//   }

//   // 3) Save changes
//   await ticket.save();
//   console.log('🔄  Saved ticket, new status =', ticket.status);

//   // 4) Return updated and populated ticket
//   const updatedTicket = await Ticket.findById(ticket._id)
//     .populate('user', 'name email')
//     .populate('comments.by', 'name email')
//     .populate('comments.replies.by', 'name email');

//   res.json({ ticket: updatedTicket });
// });

// // Add a comment
// export const addComment = asyncHandler(async (req, res) => {
//   const { text } = req.body;
//   const ticketId = req.params.id;

//   // 1) Fetch & populate the ticket
//   const ticketDoc = await Ticket.findById(ticketId)
//     .populate('user', 'name email')
//     .populate('comments.by', 'name email');

//   if (!ticketDoc) {
//     return res.status(404).json({ message: 'Ticket not found' });
//   }

//   // 2) Push the new comment
//   ticketDoc.comments.push({ by: req.user._id, text });

//   // 3) Save the document
//   await ticketDoc.save();

//   // 4) Re-populate the comments array so `by.name`/`by.email` come through
//   const updated = await Ticket.findById(ticketId)
//     .populate('user', 'name email')
//     .populate('comments.by', 'name email');

//   // 5) Return it under the `ticket` key
//   res.json({ ticket: updated });
// });
// // Close (archive) a ticket
// export const closeTicket = asyncHandler(async (req, res) => {
//   const ticket = await Ticket.findByIdAndUpdate(
//     req.params.id,
//     { status: 'closed' },
//     { new: true }
//   );
//   if (!ticket) return res.status(404).json({ message: 'Ticket not found' });
//   res.json({ ticket });
// });



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

  // Optionally notify support team or the user
  // await sendNewCommentEmail(...);

  res.status(201).json({ ticket });
});

// List tickets (optionally filter by status)
export const listTickets = asyncHandler(async (req, res) => {
  const { status, priority, page = 1, limit = 20 } = req.query;
  const filter = {};
  if (status) filter.status = status;
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
    .populate('comments.by', 'name email')
    .populate('comments.replies.by', 'name email');
  if (!ticket) return res.status(404).json({ message: 'Ticket not found' });
  res.json({ ticket });
});

// Update ticket status, priority, add comment or reply
export const updateTicket = asyncHandler(async (req, res) => {
  const { status, priority, text, parentId } = req.body;
  const ticket = await Ticket.findById(req.params.id)
    .populate('user', 'name email')
    .populate('comments.by', 'name email')
    .populate('comments.replies.by', 'name email');

  if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

  // Update status or priority
  if (status) ticket.status = status;
  if (priority) ticket.priority = priority;

  // Handle new comment or reply
  let notifiedEmail = null;
  let emailData = {};
  if (text) {
    if (parentId) {
      const parent = ticket.comments.id(parentId);
      if (!parent) {
        return res.status(400).json({ message: 'Parent comment not found' });
      }
      parent.replies.push({ by: req.user._id, text });
      notifiedEmail = parent.by.email;
      emailData = {
        userName:      parent.by.name,
        commenterName: req.user.name,
        comment:       text,
        ticketId:      ticket._id
      };
    } else {
      ticket.comments.push({ by: req.user._id, text });
      notifiedEmail = ticket.user.email;
      emailData = {
        userName:      ticket.user.name,
        commenterName: req.user.name,
        comment:       text,
        ticketId:      ticket._id
      };
    }
  }

  // Save the ticket
  await ticket.save();

  // Send email notifications
  if (status && ticket.user.email) {
    await sendTicketUpdateEmail(ticket.user.email, {
      userName:  ticket.user.name,
      subject:   ticket.subject,
      newStatus: ticket.status,
      ticketId:  ticket._id
    });
  }
  if (text && notifiedEmail) {
    await sendNewCommentEmail(notifiedEmail, emailData);
  }

  // Return updated ticket
  const updated = await Ticket.findById(ticket._id)
    .populate('user', 'name email')
    .populate('comments.by', 'name email')
    .populate('comments.replies.by', 'name email');

  res.json({ ticket: updated });
});

// Add a comment (legacy endpoint)
export const addComment = asyncHandler(async (req, res) => {
  const { text } = req.body;
  const ticketDoc = await Ticket.findById(req.params.id)
    .populate('user', 'name email')
    .populate('comments.by', 'name email')
    .populate('comments.replies.by', 'name email');

  if (!ticketDoc) return res.status(404).json({ message: 'Ticket not found' });

  ticketDoc.comments.push({ by: req.user._id, text });
  await ticketDoc.save();

  // Notify ticket owner
  await sendNewCommentEmail(ticketDoc.user.email, {
    userName:      ticketDoc.user.name,
    commenterName: req.user.name,
    comment:       text,
    ticketId:      ticketDoc._id
  });

  const updated = await Ticket.findById(ticketDoc._id)
    .populate('user', 'name email')
    .populate('comments.by', 'name email')
    .populate('comments.replies.by', 'name email');

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

  // Notify user
  await sendTicketUpdateEmail(ticket.user.email, {
    userName:  ticket.user.name,
    subject:   ticket.subject,
    newStatus: ticket.status,
    ticketId:  ticket._id
  });

  res.json({ ticket });
});
