import mongoose from 'mongoose';
import Quiz from './Quiz.js';
import Topic from './Topic.js';


const subTopicSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, minlength: 2, maxlength: 120 },
  topic: { type: mongoose.Schema.Types.ObjectId, ref: 'Topic', required: true, index: true },
  description: { type: String, trim: true, default: '', maxlength: 1000 },
  icon: { type: String, trim: true, default: '', maxlength: 40 },
  isVisible: { type: Boolean, default: true, index: true },
  order: { type: Number, default: 0, min: 0, max: 999 }
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

subTopicSchema.post('save', async function(doc) {
  // Only create if no quiz exists for this subtopic
  const quizExists = await Quiz.findOne({ subTopic: doc._id });
  if (!quizExists) {
    await Quiz.create({
      title: doc.name,
      category: doc.topic ? (await Topic.findById(doc.topic)).category : null,
      topic: doc.topic,
      subTopic: doc._id,
      level: 'Beginner',
      questions: [],
      duration: 30,
      totalMarks: 0,
      isActive: true
    });
  }
});


// 🚨 Cascade delete: Remove all quizzes that reference this subtopic
subTopicSchema.post('findOneAndDelete', async function (doc) {
  if (!doc) return;
  await Quiz.deleteMany({ subTopic: doc._id });
});

subTopicSchema.index({ name: 1, topic: 1 }, { unique: true });
subTopicSchema.index({ topic: 1, isVisible: 1, order: 1 });

export default mongoose.model('SubTopic', subTopicSchema);
