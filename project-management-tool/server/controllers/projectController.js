import Comment from "../models/Comment.js";
import Project from "../models/Project.js";
import Task from "../models/Task.js";
import User from "../models/User.js";

export const listProjects = async (req, res) => {
  const projects = await Project.find({
    $or: [{ owner: req.user._id }, { members: req.user._id }]
  })
    .populate("owner", "name email")
    .populate("members", "name email")
    .sort({ updatedAt: -1 });

  return res.status(200).json({ projects });
};

export const createProject = async (req, res) => {
  const project = await Project.create({
    name: req.body.name,
    description: req.body.description ?? "",
    owner: req.user._id
  });

  return res.status(201).json({ project });
};

export const getProject = async (req, res) => {
  await req.project.populate("owner", "name email");
  await req.project.populate("members", "name email");

  return res.status(200).json({ project: req.project });
};

export const updateProject = async (req, res) => {
  if ("name" in req.body) {
    req.project.name = req.body.name;
  }

  if ("description" in req.body) {
    req.project.description = req.body.description;
  }

  await req.project.save();

  return res.status(200).json({ project: req.project });
};

export const deleteProject = async (req, res) => {
  const tasks = await Task.find({ project: req.project._id }).select("_id");
  const taskIds = tasks.map((task) => task._id);

  if (taskIds.length > 0) {
    await Comment.deleteMany({ task: { $in: taskIds } });
  }

  await Task.deleteMany({ project: req.project._id });
  await req.project.deleteOne();

  return res.status(200).json({ message: "Project and its tasks were deleted." });
};

export const addProjectMember = async (req, res) => {
  const member = await User.findOne({ email: req.body.email });

  if (!member) {
    return res.status(404).json({ message: "No user was found with that email address." });
  }

  if (
    req.project.owner.equals(member._id) ||
    req.project.members.some((memberId) => memberId.equals(member._id))
  ) {
    return res.status(409).json({ message: "That user already has access to this project." });
  }

  req.project.members.push(member._id);
  await req.project.save();
  await req.project.populate("owner", "name email");
  await req.project.populate("members", "name email");

  return res.status(200).json({ project: req.project });
};

export const removeProjectMember = async (req, res) => {
  const memberId = req.params.userId;

  if (req.project.owner.equals(memberId)) {
    return res.status(400).json({ message: "The project owner cannot be removed." });
  }

  const memberIndex = req.project.members.findIndex((id) => id.equals(memberId));

  if (memberIndex === -1) {
    return res.status(404).json({ message: "That user is not a member of this project." });
  }

  req.project.members.splice(memberIndex, 1);
  await req.project.save();
  await req.project.populate("owner", "name email");
  await req.project.populate("members", "name email");

  return res.status(200).json({ project: req.project });
};
