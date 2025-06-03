import mongoose from 'mongoose';

const TutorialCategorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true, index: true },
  description: { type: String, default: '' },
}, { timestamps: true });

export default mongoose.model('TutorialCategory', TutorialCategorySchema);
