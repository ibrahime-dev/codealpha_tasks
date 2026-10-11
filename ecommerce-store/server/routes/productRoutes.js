
"use strict";

const express = require("express");

const {
  getProducts,
  getProductById
} = require("../controllers/productController");

const router = express.Router();

// GET /api/products
// Get all products, with optional search and category filters.
router.get("/", getProducts);

// GET /api/products/:id
// Get one product by its MongoDB ID.
router.get("/:id", getProductById);

module.exports = router;
