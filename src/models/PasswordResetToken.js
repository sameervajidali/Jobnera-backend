import mongoose from 'mongoose';
const schema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  token:  { type: String, required: true },
  createdAt: { type: Date, default: Date.now, expires: '1h' }
});
export default mongoose.model('PasswordResetToken', schema);
