import { Router } from "express";
import { body, param } from "express-validator";
import {
  createTaskComment,
  listTaskComments
} from "../controllers/commentController.js";
import requireAuth from "../middleware/authMiddleware.js";
import {
  loadTaskAndProject,
  requireTaskProjectMember
} from "../middleware/accessMiddleware.js";
import methodNotAllowed from "../middleware/methodNotAllowed.js";
import validateRequest from "../middleware/validateRequest.js";
import asyncHandler from "../utils/asyncHandler.js";

const router = Router();

router.use(requireAuth);

router.get(
  "/:taskId/comments",
  param("taskId").isMongoId().withMessage("Task ID is invalid."),
  validateRequest,
  loadTaskAndProject,
  requireTaskProjectMember,
  asyncHandler(listTaskComments)
);

router.post(
  "/:taskId/comments",
  [
    param("taskId").isMongoId().withMessage("Task ID is invalid."),
    body("text")
      .isString()
      .withMessage("Comment must be text.")
      .bail()
      .trim()
      .isLength({ min: 1, max: 2000 })
      .withMessage("Comment must be between 1 and 2000 characters.")
  ],
  validateRequest,
  loadTaskAndProject,
  requireTaskProjectMember,
  asyncHandler(createTaskComment)
);

router.all("/:taskId/comments", methodNotAllowed(["GET", "POST"]));

export default router;
