import mongoose from "mongoose";
import dotenv from "dotenv";
import "../src/models/SubTopic.js";

import Quiz from "../src/models/Quiz.js"; // adjust path if script location changes

dotenv.config({ path: '../.env' });




async function test() {
  await mongoose.connect('mongodb+srv://techwithvajid:qRfWHoFdOFFyWmYe@cluster0.hxfrzs2.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0');

  // Find any quiz with a subTopic field
  const q = await Quiz.findOne({ subTopic: { $exists: true } }).populate("subTopic", "name");
  console.log("POPULATED subTopic:", q?.subTopic);

  await mongoose.disconnect();
}

test().catch(console.error);
