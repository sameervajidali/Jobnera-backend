import mongoose from 'mongoose';

const roleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true,
  },
  // e.g. ['CREATE_USER','DELETE_USER','MANAGE_ROLES', ...]
  permissions: {
    type: [String],
    default: [],
  },
}, {
  timestamps: true,
});

export default mongoose.model('Role', roleSchema);
