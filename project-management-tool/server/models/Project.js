import mongoose from "mongoose";

const projectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Project name is required."],
      trim: true,
      minlength: [2, "Project name must be at least 2 characters long."],
      maxlength: [120, "Project name cannot be longer than 120 characters."]
    },
    description: {
      type: String,
      trim: true,
      maxlength: [2000, "Project description cannot be longer than 2000 characters."],
      default: ""
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      }
    ]
  },
  { timestamps: true }
);

projectSchema.index({ owner: 1 });
projectSchema.index({ members: 1 });

const Project = mongoose.model("Project", projectSchema);

export default Project;
