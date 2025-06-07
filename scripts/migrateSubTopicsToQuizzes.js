import dotenv from "dotenv";
import mongoose from "mongoose";

import Quiz from "../src/models/Quiz.js";
import SubTopic from "../src/models/SubTopic.js";

dotenv.config({ path: '../.env' }); // If your .env is one directory up from /scripts


async function migrateSubTopicsToQuizzes() {
  await mongoose.connect(process.env.MONGO_URI);

  const quizzes = await Quiz.find().lean();

  let updated = 0;

  for (const quiz of quizzes) {
    // Find the correct SubTopic by name + topic
    // Replace quiz.title with the right mapping if needed
    const subTopic = await SubTopic.findOne({
      name: quiz.title, // if title matches old subtopic name
      topic: quiz.topic,
    });

    if (subTopic) {
      await Quiz.updateOne(
        { _id: quiz._id },
        { $set: { subTopic: subTopic._id } }
      );
      updated++;
    } else {
      console.warn(
        `No matching subtopic found for quiz "${quiz._id}" (title: "${quiz.title}", topic: "${quiz.topic}")`
      );
    }
  }

  console.log(`Updated ${updated} quizzes with subTopic references.`);
  await mongoose.disconnect();
}

migrateSubTopicsToQuizzes().catch((err) => {
  console.error(err);
  process.exit(1);
});
