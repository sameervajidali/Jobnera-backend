import mongoose from 'mongoose';
import Quiz from './Quiz.js';   // or '../models/Quiz.js' depending on your folder structure
const subTopicSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "SubTopic name is required"],
    trim: true,
    minlength: [2, "SubTopic name must be at least 2 characters long"],
    maxlength: [120, "SubTopic name must be at most 120 characters"],
  },
  topic: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Topic',
    required: [true, "Associated topic is required"],
  },
  description: {
    type: String,
    trim: true,
    default: '',
    maxlength: 1000,
  },
  icon: {
    type: String,
    trim: true,
    default: '',
  },
  isVisible: {
    type: Boolean,
    default: true,
  },
  order: {
    type: Number,
    default: 0,
    min: 0,
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// after you define the schema, add:
subTopicSchema.post('save', async function (doc) {
  // doc is the newly-created SubTopic
  await Quiz.updateMany(
    { topic: doc.topic },
    { $push: { subTopics: doc._id } }
  );
});

subTopicSchema.index({ name: 1, topic: 1 }, { unique: true });
export default mongoose.model('SubTopic', subTopicSchema);
