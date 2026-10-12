import { Router } from "express";
import { body, param } from "express-validator";
import {
  deleteTask,
  getTask,
  updateTask,
  updateTaskStatus
} from "../controllers/taskController.js";
import requireAuth from "../middleware/authMiddleware.js";
import {
  loadTaskAndProject,
  requireProjectOwner,
  requireTaskProjectMember
} from "../middleware/accessMiddleware.js";
import methodNotAllowed from "../middleware/methodNotAllowed.js";
import validateRequest from "../middleware/validateRequest.js";
import asyncHandler from "../utils/asyncHandler.js";

const router = Router();

router.use(requireAuth);

router.get(
  "/:taskId",
  param("taskId").isMongoId().withMessage("Task ID is invalid."),
  validateRequest,
  loadTaskAndProject,
  requireTaskProjectMember,
  asyncHandler(getTask)
);

router.put(
  "/:taskId",
  [
    param("taskId").isMongoId().withMessage("Task ID is invalid."),
    body().custom((_value, { req }) => {
      const allowedFields = ["title", "description", "assignedTo", "dueDate"];
      return (
        req.body &&
        typeof req.body === "object" &&
        !Array.isArray(req.body) &&
        Object.keys(req.body).some((field) => allowedFields.includes(field)) &&
        Object.keys(req.body).every((field) => allowedFields.includes(field))
      );
    }).withMessage("Provide only task title, description, assignee, or due date fields."),
    body("title")
      .optional()
      .isString()
      .withMessage("Task title must be text.")
      .bail()
      .trim()
      .isLength({ min: 2, max: 160 })
      .withMessage("Task title must be between 2 and 160 characters."),
    body("description")
      .optional()
      .isString()
      .withMessage("Task description must be text.")
      .bail()
      .trim()
      .isLength({ max: 5000 })
      .withMessage("Task description cannot be longer than 5000 characters."),
    body("assignedTo")
      .optional({ values: "null" })
      .isMongoId()
      .withMessage("Assignee ID is invalid."),
    body("dueDate")
      .optional({ values: "null" })
      .isISO8601()
      .withMessage("Due date must be a valid ISO 8601 date.")
  ],
  validateRequest,
  loadTaskAndProject,
  requireTaskProjectMember,
  asyncHandler(updateTask)
);

router.patch(
  "/:taskId/status",
  [
    param("taskId").isMongoId().withMessage("Task ID is invalid."),
    body("status")
      .isIn(["todo", "inProgress", "done"])
      .withMessage("Status must be todo, inProgress, or done.")
  ],
  validateRequest,
  loadTaskAndProject,
  requireTaskProjectMember,
  asyncHandler(updateTaskStatus)
);

router.delete(
  "/:taskId",
  param("taskId").isMongoId().withMessage("Task ID is invalid."),
  validateRequest,
  loadTaskAndProject,
  requireProjectOwner,
  asyncHandler(deleteTask)
);

router.all("/:taskId/status", methodNotAllowed(["PATCH"]));
router.all("/:taskId", methodNotAllowed(["GET", "PUT", "DELETE"]));

export default router;
