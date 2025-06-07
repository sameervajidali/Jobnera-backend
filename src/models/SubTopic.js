// src/models/SubTopic.js
import mongoose from 'mongoose';
import Quiz from './Quiz.js';

const subTopicSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, minlength: 2, maxlength: 120 },
  topic: { type: mongoose.Schema.Types.ObjectId, ref: 'Topic', required: true, index: true },
  description: { type: String, trim: true, default: '', maxlength: 1000 },
  icon: { type: String, trim: true, default: '', maxlength: 40 },
  isVisible: { type: Boolean, default: true, index: true },
  order: { type: Number, default: 0, min: 0, max: 999 }
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

// Keep all quizzes in sync with subtopics
subTopicSchema.post('save', async function (doc) {
  await Quiz.updateMany(
    { topic: doc.topic },
    { $addToSet: { subTopics: doc._id } }
  );
});
subTopicSchema.post('findOneAndDelete', async function (doc) {
  if (doc) {
    await Quiz.updateMany(
      { topic: doc.topic },
      { $pull: { subTopics: doc._id } }
    );
  }
});

// Virtual: quiz count
subTopicSchema.virtual('quizCount', {
  ref: 'Quiz',
  localField: '_id',
  foreignField: 'subTopic',
  count: true
});

subTopicSchema.index({ name: 1, topic: 1 }, { unique: true });
subTopicSchema.index({ topic: 1, isVisible: 1, order: 1 });

export default mongoose.model('SubTopic', subTopicSchema);
