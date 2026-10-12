import { Router } from "express";
import { body, param } from "express-validator";
import {
  addProjectMember,
  createProject,
  deleteProject,
  getProject,
  listProjects,
  removeProjectMember,
  updateProject
} from "../controllers/projectController.js";
import { createTask, listProjectTasks } from "../controllers/taskController.js";
import requireAuth from "../middleware/authMiddleware.js";
import {
  loadProject,
  requireProjectMember,
  requireProjectOwner
} from "../middleware/accessMiddleware.js";
import methodNotAllowed from "../middleware/methodNotAllowed.js";
import validateRequest from "../middleware/validateRequest.js";
import asyncHandler from "../utils/asyncHandler.js";

const router = Router();

router.use(requireAuth);

router.get("/", asyncHandler(listProjects));

router.post(
  "/",
  [
    body("name")
      .isString()
      .withMessage("Project name must be text.")
      .bail()
      .trim()
      .isLength({ min: 2, max: 120 })
      .withMessage("Project name must be between 2 and 120 characters."),
    body("description")
      .optional()
      .isString()
      .withMessage("Project description must be text.")
      .bail()
      .trim()
      .isLength({ max: 2000 })
      .withMessage("Project description cannot be longer than 2000 characters.")
  ],
  validateRequest,
  asyncHandler(createProject)
);

router.get(
  "/:projectId/tasks",
  param("projectId").isMongoId().withMessage("Project ID is invalid."),
  validateRequest,
  loadProject,
  requireProjectMember,
  asyncHandler(listProjectTasks)
);

router.post(
  "/:projectId/tasks",
  [
    param("projectId").isMongoId().withMessage("Project ID is invalid."),
    body("title")
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
    body("status")
      .optional()
      .isIn(["todo", "inProgress", "done"])
      .withMessage("Status must be todo, inProgress, or done."),
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
  loadProject,
  requireProjectMember,
  asyncHandler(createTask)
);

router.get(
  "/:projectId",
  param("projectId").isMongoId().withMessage("Project ID is invalid."),
  validateRequest,
  loadProject,
  requireProjectMember,
  asyncHandler(getProject)
);

router.put(
  "/:projectId",
  [
    param("projectId").isMongoId().withMessage("Project ID is invalid."),
    body().custom((_value, { req }) =>
      req.body &&
      typeof req.body === "object" &&
      !Array.isArray(req.body) &&
      (Object.hasOwn(req.body, "name") || Object.hasOwn(req.body, "description"))
    ).withMessage("Provide a project name, description, or both."),
    body("name")
      .optional()
      .isString()
      .withMessage("Project name must be text.")
      .bail()
      .trim()
      .isLength({ min: 2, max: 120 })
      .withMessage("Project name must be between 2 and 120 characters."),
    body("description")
      .optional()
      .isString()
      .withMessage("Project description must be text.")
      .bail()
      .trim()
      .isLength({ max: 2000 })
      .withMessage("Project description cannot be longer than 2000 characters.")
  ],
  validateRequest,
  loadProject,
  requireProjectOwner,
  asyncHandler(updateProject)
);

router.delete(
  "/:projectId",
  param("projectId").isMongoId().withMessage("Project ID is invalid."),
  validateRequest,
  loadProject,
  requireProjectOwner,
  asyncHandler(deleteProject)
);

router.post(
  "/:projectId/members",
  [
    param("projectId").isMongoId().withMessage("Project ID is invalid."),
    body("email")
      .isString()
      .withMessage("Email must be text.")
      .bail()
      .trim()
      .isEmail()
      .withMessage("Enter a valid email address.")
      .normalizeEmail()
  ],
  validateRequest,
  loadProject,
  requireProjectOwner,
  asyncHandler(addProjectMember)
);

router.delete(
  "/:projectId/members/:userId",
  [
    param("projectId").isMongoId().withMessage("Project ID is invalid."),
    param("userId").isMongoId().withMessage("User ID is invalid.")
  ],
  validateRequest,
  loadProject,
  requireProjectOwner,
  asyncHandler(removeProjectMember)
);

router.all("/", methodNotAllowed(["GET", "POST"]));
router.all("/:projectId/tasks", methodNotAllowed(["GET", "POST"]));
router.all("/:projectId/members/:userId", methodNotAllowed(["DELETE"]));
router.all("/:projectId/members", methodNotAllowed(["POST"]));
router.all("/:projectId", methodNotAllowed(["GET", "PUT", "DELETE"]));

export default router;
