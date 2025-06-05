import mongoose from 'mongoose';

const topicSchema = new mongoose.Schema({
  // Topic name
  name: {
    type: String,
    required: true,
    trim: true,
  },
  // Reference to the Category this topic belongs to
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true,
  },
}, { timestamps: true }); // Automatically adds createdAt and updatedAt fields

export default mongoose.model('Topic', topicSchema);
