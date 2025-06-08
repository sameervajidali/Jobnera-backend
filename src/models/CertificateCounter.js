// models/CertificateCounter.js
import mongoose from 'mongoose';
const CertificateCounterSchema = new mongoose.Schema({
  date: { type: String, required: true, unique: true }, // e.g. "20250608"
  seq: { type: Number, default: 0 },
});
export default mongoose.model('CertificateCounter', CertificateCounterSchema);