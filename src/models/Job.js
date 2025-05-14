import mongoose from 'mongoose';

const JobSchema = new mongoose.Schema({
  title:         { type: String, required: true, trim: true },
  company:       { type: String, required: true },
  location:      { type: String, required: true },
  workType:      { type: String, enum: ['Remote', 'On-site', 'Hybrid'], default: 'Remote' },
  jobType:       { type: String, enum: ['Full-time', 'Part-time', 'Contract'], default: 'Full-time' },
  skills:        [{ type: String }],
  salaryRange:   { type: String }, // Optional, e.g. "$60k–$90k"
  applyLink:     { type: String, required: true },
  source:        { type: String, default: 'Manual' }, // "LinkedIn", "Indeed", etc.
  postedAt:      { type: Date, default: Date.now },
  expiresAt:     { type: Date }, // Optional
  createdBy:     { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // ADMIN user
}, { timestamps: true });

export default mongoose.model('Job', JobSchema);
