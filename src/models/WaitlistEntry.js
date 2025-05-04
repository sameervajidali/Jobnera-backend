import mongoose from 'mongoose';

const waitlistSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  interest: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model('WaitlistEntry', waitlistSchema);
