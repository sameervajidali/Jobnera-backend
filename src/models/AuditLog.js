import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: true,
      index: true, // fast filter
    },
    resourceType: {
      type: String,
      required: true,
      index: true,
      // e.g. 'BlogPost', 'Quiz', 'User', 'File', 'Role', 'Setting'
    },
    resourceId: {
      type: mongoose.Schema.Types.ObjectId,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    details: {
      type: Object, // { before, after, fieldsChanged, ... }
      default: {},
    },
    ipAddress: String,
    userAgent: String,
    requestId: String, // Unique request ID for tracing
    sessionId: String, // If you use sessions
    location: {
      type: { lat: Number, lon: Number },
      required: false,
    },
  },
  { timestamps: true }
);

auditLogSchema.index({ action: 1, createdAt: -1 });
auditLogSchema.index({ resourceType: 1, resourceId: 1 });

export default mongoose.model('AuditLog', auditLogSchema);
