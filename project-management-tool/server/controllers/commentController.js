import Comment from "../models/Comment.js";

export const listTaskComments = async (req, res) => {
  const comments = await Comment.find({ task: req.task._id })
    .populate("user", "name email")
    .sort({ createdAt: 1 });

  return res.status(200).json({ comments });
};

export const createTaskComment = async (req, res) => {
  const comment = await Comment.create({
    text: req.body.text,
    task: req.task._id,
    user: req.user._id
  });

  await comment.populate("user", "name email");
  return res.status(201).json({ comment });
};
