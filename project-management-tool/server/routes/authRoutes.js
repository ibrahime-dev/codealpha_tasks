import { Router } from "express";
import { body } from "express-validator";
import { login, register } from "../controllers/authController.js";
import methodNotAllowed from "../middleware/methodNotAllowed.js";
import validateRequest from "../middleware/validateRequest.js";
import asyncHandler from "../utils/asyncHandler.js";

const router = Router();

router.post(
  "/register",
  [
    body("name")
      .isString()
      .withMessage("Name must be text.")
      .bail()
      .trim()
      .isLength({ min: 2, max: 80 })
      .withMessage("Name must be between 2 and 80 characters."),
    body("email")
      .isString()
      .withMessage("Email must be text.")
      .bail()
      .trim()
      .isEmail()
      .withMessage("Enter a valid email address.")
      .normalizeEmail(),
    body("password")
      .isString()
      .withMessage("Password must be text.")
      .bail()
      .isLength({ min: 8, max: 128 })
      .withMessage("Password must be between 8 and 128 characters.")
  ],
  validateRequest,
  asyncHandler(register)
);

router.post(
  "/login",
  [
    body("email")
      .isString()
      .withMessage("Email must be text.")
      .bail()
      .trim()
      .isEmail()
      .withMessage("Enter a valid email address.")
      .normalizeEmail(),
    body("password")
      .isString()
      .withMessage("Password must be text.")
      .bail()
      .isLength({ min: 1, max: 128 })
      .withMessage("Password is required.")
  ],
  validateRequest,
  asyncHandler(login)
);

router.all("/register", methodNotAllowed(["POST"]));
router.all("/login", methodNotAllowed(["POST"]));

export default router;
