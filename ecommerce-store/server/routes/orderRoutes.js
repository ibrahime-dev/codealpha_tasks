
"use strict";

const express = require("express");

const {
  createOrder,
  getMyOrders
} = require("../controllers/orderController");

const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// Customers must be logged in to place an order.
router.post("/", protect, createOrder);

// Customers can view only their own order history.
router.get("/my-orders", protect, getMyOrders);

module.exports = router;
