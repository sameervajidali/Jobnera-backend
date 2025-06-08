import mongoose from "mongoose";

const blogCategorySchema = new mongoose.Schema({
  name:        { type: String, required: true },
  slug:        { type: String, required: true, unique: true },
  description: { type: String },
  parent:      { type: mongoose.Schema.Types.ObjectId, ref: "BlogCategory" },
  order:       { type: Number, default: 0 },
}, { timestamps: true });

export default mongoose.model("BlogCategory", blogCategorySchema);
