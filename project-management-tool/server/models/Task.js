import mongoose from "mongoose";

export const TASK_STATUSES = ["todo", "inProgress", "done"];

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Task title is required."],
      trim: true,
      minlength: [2, "Task title must be at least 2 characters long."],
      maxlength: [160, "Task title cannot be longer than 160 characters."]
    },
    description: {
      type: String,
      trim: true,
      maxlength: [5000, "Task description cannot be longer than 5000 characters."],
      default: ""
    },
    status: {
      type: String,
      enum: TASK_STATUSES,
      default: "todo"
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },
    dueDate: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
);

taskSchema.index({ project: 1, status: 1 });

const Task = mongoose.model("Task", taskSchema);

export default Task;
