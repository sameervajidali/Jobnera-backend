import dotenv from "dotenv";
import mongoose from "mongoose";

import Quiz from "../src/models/Quiz.js";      // update path if needed
import SubTopic from "../src/models/SubTopic.js"; // update path if needed

import path from 'path';
dotenv.config({ path: path.resolve('../.env') }); // if your .env is one level up from /scripts


async function dryRun() {
  await mongoose.connect(process.env.MONGO_URI);

  const quizzes = await Quiz.find();
  console.log(`Loaded ${quizzes.length} quizzes.`);

  // Map to track what subtopics we'd create: key = name||topic
  const subTopicMap = new Map();

  let wouldCreate = 0;
  let wouldReuse = 0;
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

    // Check if we'd already create or reuse
    if (!subTopicMap.has(key)) {
      // Check actual DB (simulate live scenario)
      const exists = await SubTopic.findOne({ name, topic });
      if (exists) {
        console.log(
          `Would REUSE: SubTopic "${name}" (topic ${topic}) for Quiz ${quiz._id} (already exists: ${exists._id})`
        );
        subTopicMap.set(key, exists._id);
        wouldReuse++;
      } else {
        // Would create
        const fakeId = `NEW_${wouldCreate + 1}`;
        console.log(
          `Would CREATE: SubTopic "${name}" (topic ${topic}) for Quiz ${quiz._id} (simulate id: ${fakeId})`
        );
        subTopicMap.set(key, fakeId);
        wouldCreate++;
      }
    } else {
      // Already handled this subtopic
      const usedId = subTopicMap.get(key);
      console.log(
        `Would LINK: Quiz ${quiz._id} ("${name}") → SubTopic (${usedId})`
      );
      wouldReuse++;
    }
  }

  console.log("\n====== SUMMARY ======");
  console.log(`Would create ${wouldCreate} new SubTopics`);
  console.log(`Would reuse/link to existing ${wouldReuse} SubTopics`);
  console.log(`Skipped ${skipped} quizzes (missing title/topic)`);
  console.log(
    `Total unique subtopic combinations handled: ${subTopicMap.size}`
  );
  await mongoose.disconnect();
  console.log("Dry run complete.");
}

dryRun().catch((err) => {
  console.error(err);
  process.exit(1);
});
