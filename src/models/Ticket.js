// src/models/Ticket.js
import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const TicketSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  subject: {
    type: String,
    required: true,
    trim: true
  },
  message: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['open', 'in_progress', 'closed'],
    default: 'open'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  comments: [
    {
      by:    { type: Schema.Types.ObjectId, ref: 'User' },
      text:  String,
      at:    { type: Date, default: Date.now }
    }
  ]
}, {
  timestamps: true
});

export default model('Ticket', TicketSchema);
