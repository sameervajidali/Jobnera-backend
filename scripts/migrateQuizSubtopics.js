import mongoose from "mongoose";
import dotenv from "dotenv";
import Quiz from "../src/models/Quiz.js";      // update path if needed
import SubTopic from "../src/models/SubTopic.js"; // update path if needed

dotenv.config({ path: '../.env' }); // update path if running from scripts folder

async function migrate() {
  await mongoose.connect(process.env.MONGO_URI);
  const quizzes = await Quiz.find();
  console.log(`Loaded ${quizzes.length} quizzes.`);

  // Map to track created subtopics: key = name||topic
  const subTopicMap = new Map();

  let created = 0;
  let reused = 0;
  let updated = 0;
  let skipped = 0;

  for (const quiz of quizzes) {
    if (!quiz.title || !quiz.topic) {
      console.warn(`⚠️  Quiz ${quiz._id} missing title or topic, SKIPPED`);
      skipped++;
      continue;
    }

    const name = quiz.title.trim();
    const topic = quiz.topic.toString();
    const key = `${name.toLowerCase()}||${topic}`;

    let subTopicId;

    // Check if we've already created/reused in this script run
    if (subTopicMap.has(key)) {
      subTopicId = subTopicMap.get(key);
      reused++;
    } else {
      // Check if SubTopic exists in DB
      let subTopic = await SubTopic.findOne({ name, topic: quiz.topic });
      if (!subTopic) {
        // Create SubTopic
        subTopic = await SubTopic.create({
          name,
          topic: quiz.topic,
          // description, icon, etc. left default
        });
        created++;
        console.log(
          `Created SubTopic "${name}" (topic ${topic}) as ${subTopic._id}`
        );
      } else {
        reused++;
        console.log(
          `Reusing SubTopic "${name}" (topic ${topic}) as ${subTopic._id}`
        );
      }
      subTopicMap.set(key, subTopic._id);
      subTopicId = subTopic._id;
    }

    // Now update Quiz to set subTopic
    const result = await Quiz.updateOne(
      { _id: quiz._id },
      { $set: { subTopic: subTopicId } }
    );
    if (result.modifiedCount > 0) {
      updated++;
      console.log(
        `Quiz ${quiz._id} linked to SubTopic ${subTopicId}`
      );
    }
  }

  console.log("\n====== SUMMARY ======");
  console.log(`Created ${created} new SubTopics`);
  console.log(`Reused ${reused} existing SubTopics`);
  console.log(`Updated ${updated} quizzes with subTopic`);
  console.log(`Skipped ${skipped} quizzes (missing title/topic)`);
  await mongoose.disconnect();
  console.log("Migration complete.");
}

migrate().catch((err) => {
  console.error(err);
  process.exit(1);
});
