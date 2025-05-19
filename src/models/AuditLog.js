import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: true,
      enum: [
        'bulk_quiz_upload',
        'bulk_quiz_upload_partial',
        'quiz_created',
        'quiz_updated',
        'quiz_deleted',
        'user_login',
        'admin_login',
        'file_upload',
        'role_updated',
        'setting_changed'
      ]
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false
    },
    details: {
      type: Object,
      default: {}
    },
    ipAddress: {
      type: String
    },
    userAgent: {
      type: String
    }
  },
  {
    timestamps: true // adds createdAt and updatedAt
  }
);

export default mongoose.model('AuditLog', auditLogSchema);
