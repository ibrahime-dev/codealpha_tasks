import mongoose from "mongoose";

const commentSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      required: [true, "Comment text is required."],
      trim: true,
      minlength: [1, "Comment cannot be empty."],
      maxlength: [2000, "Comment cannot be longer than 2000 characters."]
    },
    task: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task",
      required: true
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    }
  },
  { timestamps: true }
);

commentSchema.index({ task: 1, createdAt: 1 });

const Comment = mongoose.model("Comment", commentSchema);

export default Comment;
