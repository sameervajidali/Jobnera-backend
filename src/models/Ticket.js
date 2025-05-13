import mongoose from 'mongoose';

const { Schema, model } = mongoose;

// Define sub-schema for replies
const replySchema = new Schema({
  by:   { type: Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, required: true, trim: true },
  at:   { type: Date, default: Date.now }
}, { _id: true });

// Define sub-schema for comments, including nested replies
const commentSchema = new Schema({
  by:      { type: Schema.Types.ObjectId, ref: 'User', required: true },
  text:    { type: String, required: true, trim: true },
  at:      { type: Date, default: Date.now },
  replies: [replySchema]
}, { _id: true });

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
  comments: [commentSchema]
}, {
  timestamps: true
});

export default model('Ticket', TicketSchema);
