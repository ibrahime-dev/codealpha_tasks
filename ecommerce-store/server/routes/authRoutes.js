
"use strict";

const express = require("express");

const {
  registerUser,
  loginUser
} = require("../controllers/authController");

const router = express.Router();

// Register a new customer.
router.post("/register", registerUser);

// Log in an existing customer.
router.post("/login", loginUser);

module.exports = router;
