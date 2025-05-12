// scripts/migrateQuizCategories.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

// Models
import Quiz     from '../src/models/Quiz.js';
import Category from '../src/models/Category.js';
import Topic    from '../src/models/Topic.js';

async function migrate() {
  // 1) Pick up whichever var you set in .env
  const uri =
    process.env.MONGO_URI ||
    process.env.MONGODB_URI ||
    process.env.DATABASE_URL;

  if (!uri) {
    console.error(`
❌  No MongoDB connection string found!
   Please add one of these to your .env:
     MONGO_URI=...
     MONGODB_URI=...
     DATABASE_URL=...
    `);
    process.exit(1);
  }

  // 2) Connect
  await mongoose.connect(uri, {
    useNewUrlParser:    true,
    useUnifiedTopology: true,
  });
  console.log('🔗 Connected to MongoDB');

  // 3) Gather distinct names → upsert Category & Topic, then patch Quiz docs
  const quizzes = await Quiz.find().lean();
  const byCat   = quizzes.reduce((acc, q) => {
    (acc[q.category] ||= new Set()).add(q.topic);
    return acc;
  }, {});

  // Upsert categories/topics
  const catMap = {};
  for (const [catName, topics] of Object.entries(byCat)) {
    const cat = await Category.findOneAndUpdate(
      { name: catName },
      { $setOnInsert: { name: catName } },
      { upsert: true, new: true }
    );
    catMap[catName] = cat._id;

    for (const topicName of topics) {
      await Topic.findOneAndUpdate(
        { name: topicName, category: cat._id },
        { $setOnInsert: { name: topicName, category: cat._id } },
        { upsert: true }
      );
    }
  }
  console.log('✅ Categories & Topics upserted');

  // Update each Quiz
  let updated = 0;
  for (const q of quizzes) {
    const catId = catMap[q.category];
    const tp     = await Topic.findOne({ name: q.topic, category: catId });
    if (!tp) continue;

    await Quiz.updateOne(
      { _id: q._id },
      { $set: { category: catId, topic: tp._id } }
    );
    updated++;
  }
  console.log(`🔄 Updated ${updated} quizzes with ObjectId refs`);

  await mongoose.disconnect();
  console.log('🔌 Disconnected');
}

migrate().catch(err => {
  console.error('Migration error:', err);
  process.exit(1);
});
