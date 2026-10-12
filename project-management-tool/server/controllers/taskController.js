import Comment from "../models/Comment.js";
import Task from "../models/Task.js";
import User from "../models/User.js";

const isProjectUser = (project, userId) =>
  project.owner.equals(userId) || project.members.some((memberId) => memberId.equals(userId));

const ensureAssigneeIsMember = async (project, assigneeId) => {
  if (!isProjectUser(project, assigneeId)) {
    return false;
  }

  return Boolean(await User.exists({ _id: assigneeId }));
};

export const listProjectTasks = async (req, res) => {
  const tasks = await Task.find({ project: req.project._id })
    .populate("createdBy", "name email")
    .populate("assignedTo", "name email")
    .sort({ createdAt: -1 });

  return res.status(200).json({ tasks });
};

export const createTask = async (req, res) => {
  const assignedTo = req.body.assignedTo ?? null;

  if (assignedTo && !(await ensureAssigneeIsMember(req.project, assignedTo))) {
    return res.status(400).json({ message: "Assignee must be a user with access to this project." });
  }

  const task = await Task.create({
    title: req.body.title,
    description: req.body.description ?? "",
    status: req.body.status ?? "todo",
    project: req.project._id,
    createdBy: req.user._id,
    assignedTo,
    dueDate: req.body.dueDate ? new Date(req.body.dueDate) : null
  });

  await task.populate("createdBy assignedTo", "name email");
  return res.status(201).json({ task });
};

export const getTask = async (req, res) => {
  await req.task.populate("createdBy assignedTo", "name email");
  return res.status(200).json({ task: req.task });
};

export const updateTask = async (req, res) => {
  if ("title" in req.body) {
    req.task.title = req.body.title;
  }

  if ("description" in req.body) {
    req.task.description = req.body.description;
  }

  if ("assignedTo" in req.body) {
    const assignedTo = req.body.assignedTo;

    if (assignedTo && !(await ensureAssigneeIsMember(req.project, assignedTo))) {
      return res.status(400).json({ message: "Assignee must be a user with access to this project." });
    }

    req.task.assignedTo = assignedTo || null;
  }

  if ("dueDate" in req.body) {
    req.task.dueDate = req.body.dueDate ? new Date(req.body.dueDate) : null;
  }

  await req.task.save();
  await req.task.populate("createdBy assignedTo", "name email");

  return res.status(200).json({ task: req.task });
};

export const updateTaskStatus = async (req, res) => {
  req.task.status = req.body.status;
  await req.task.save();

  return res.status(200).json({ task: req.task });
};

export const deleteTask = async (req, res) => {
  await Comment.deleteMany({ task: req.task._id });
  await req.task.deleteOne();
  return res.status(200).json({ message: "Task was deleted." });
};
