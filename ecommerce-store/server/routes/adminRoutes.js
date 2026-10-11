"use strict";

const express = require("express");
const { protect }    = require("../middleware/authMiddleware");
const { adminOnly }  = require("../middleware/adminMiddleware");
const {
  getStats,
  getAllOrders,
  updateOrderStatus,
  getAllUsers,
  createProduct,
  deleteProduct
} = require("../controllers/adminController");

const router = express.Router();

// All admin routes require login + admin role
router.use(protect, adminOnly);

router.get("/stats",                getStats);
router.get("/orders",               getAllOrders);
router.patch("/orders/:id/status",  updateOrderStatus);
router.get("/users",                getAllUsers);
router.post("/products",            createProduct);
router.delete("/products/:id",      deleteProduct);

module.exports = router;
