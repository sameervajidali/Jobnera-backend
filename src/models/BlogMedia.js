import mongoose from 'mongoose';

const metaSchema = new mongoose.Schema({
  width:    Number,
  height:   Number,
  size:     Number,
  mime:     String,
  duration: Number, // For video/audio
}, { _id: false });

const blogMediaSchema = new mongoose.Schema({
  url:        { type: String, required: true, trim: true }, // Supabase URL
  type:       { type: String, enum: ['image', 'video', 'file'], required: true },
  alt:        { type: String, trim: true, default: '' },
  caption:    { type: String, trim: true, default: '' },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  attachedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'BlogPost' }, // Optional, for asset linking
  meta:       { type: metaSchema },
}, { timestamps: true });

export default mongoose.model('BlogMedia', blogMediaSchema);
