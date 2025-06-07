import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import Quiz from "../src/models/Quiz.js"; // Adjust path as needed

dotenv.config({ path: '../.env' }); // Adjust if needed

async function restoreQuizTitles() {
  await mongoose.connect(process.env.MONGO_URI);

  // Load your backup file
  const raw = fs.readFileSync(path.join(process.cwd(), "test.quizzes.json"), "utf-8");
  const backupQuizzes = JSON.parse(raw);

  let updated = 0;
  for (const bq of backupQuizzes) {
    // Handle $oid wrapper
    let quizId = bq._id;
    if (quizId && typeof quizId === "object" && quizId.$oid) quizId = quizId.$oid;
    if (!quizId || !bq.title) continue;

    const res = await Quiz.updateOne(
      { _id: quizId },
      { $set: { title: bq.title } }
    );
    if (res.modifiedCount) updated++;
  }

  console.log(`Restored 'title' for ${updated} quizzes.`);
  await mongoose.disconnect();
}

restoreQuizTitles().catch((err) => {
  console.error(err);
  process.exit(1);
});
