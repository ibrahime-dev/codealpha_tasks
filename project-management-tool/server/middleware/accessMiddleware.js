import Project from "../models/Project.js";
import Task from "../models/Task.js";

const isProjectMember = (project, userId) =>
  project.owner.equals(userId) || project.members.some((memberId) => memberId.equals(userId));

export const loadProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.projectId);

    if (!project) {
      return res.status(404).json({ message: "Project not found." });
    }

    req.project = project;
    return next();
  } catch (error) {
    return next(error);
  }
};

export const requireProjectMember = (req, res, next) => {
  if (!isProjectMember(req.project, req.user._id)) {
    return res.status(403).json({ message: "You do not have access to this project." });
  }

  return next();
};

export const requireProjectOwner = (req, res, next) => {
  if (!req.project.owner.equals(req.user._id)) {
    return res.status(403).json({ message: "Only the project owner can perform this action." });
  }

  return next();
};

export const loadTaskAndProject = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.taskId).populate("project");

    if (!task) {
      return res.status(404).json({ message: "Task not found." });
    }

    if (!task.project) {
      return res.status(404).json({ message: "The project for this task no longer exists." });
    }

    req.task = task;
    req.project = task.project;
    return next();
  } catch (error) {
    return next(error);
  }
};

export const requireTaskProjectMember = (req, res, next) => {
  if (!isProjectMember(req.project, req.user._id)) {
    return res.status(403).json({ message: "You do not have access to this task." });
  }

  return next();
};
