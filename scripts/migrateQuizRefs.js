// scripts/migrateQuizRefs.js
import mongoose from "mongoose";
import dotenv   from "dotenv";
import Quiz     from "../src/models/Quiz.js";

dotenv.config();

async function migrate() {
  await mongoose.connect(process.env.MONGO_URI);

  // Fetch every quiz
  const quizzes = await Quiz.find().lean();
  for (const q of quizzes) {
    const updates = {};

    if (typeof q.category === "string") {
      updates.category = new mongoose.Types.ObjectId(q.category);
    }

    if (typeof q.topic === "string") {
      updates.topic = new mongoose.Types.ObjectId(q.topic);
    }

    if (Object.keys(updates).length > 0) {
      await Quiz.updateOne({ _id: q._id }, { $set: updates });
      console.log(`✔️ Migrated quiz ${q._id}`);
    }
  }

  console.log("✅ All quizzes migrated");
  await mongoose.disconnect();
}

migrate().catch(err => {
  console.error("Migration failed:", err);
  process.exit(1);
});
