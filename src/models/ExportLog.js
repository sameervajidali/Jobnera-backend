import mongoose from 'mongoose';

const exportLogSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false }, // user who triggered export (optional)
  action: { type: String, required: true }, // e.g. 'download_quizzes_csv', 'bulk_upload_quizzes'
  details: { type: Object, default: {} },   // additional info, e.g. counts, file names
  createdAt: { type: Date, default: Date.now }
});

const ExportLog = mongoose.model('ExportLog', exportLogSchema);

export default ExportLog;
