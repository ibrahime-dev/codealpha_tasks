"use strict";

const User    = require("../models/User");
const Product = require("../models/Product");
const Order   = require("../models/Order");

// GET /api/admin/stats
const getStats = async (req, res) => {
  try {
    const [productCount, orderCount, userCount, revenueData] = await Promise.all([
      Product.countDocuments({ isActive: true }),
      Order.countDocuments(),
      User.countDocuments({ role: "customer" }),
      Order.aggregate([
        { $match: { orderStatus: { $ne: "cancelled" } } },
        { $group: { _id: null, total: { $sum: "$total" } } }
      ])
    ]);

    const revenue = revenueData.length > 0 ? revenueData[0].total : 0;

    return res.status(200).json({ productCount, orderCount, userCount, revenue });
  } catch (error) {
    console.error("Admin stats error:", error.message);
    return res.status(500).json({ message: "Unable to load stats." });
  }
};

// GET /api/admin/orders
const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("user", "name email")
      .sort({ createdAt: -1 });

    return res.status(200).json({ count: orders.length, orders });
  } catch (error) {
    console.error("Admin orders error:", error.message);
    return res.status(500).json({ message: "Unable to load orders." });
  }
};

// PATCH /api/admin/orders/:id/status
const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ["pending","confirmed","processing","shipped","delivered","cancelled"];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid order status." });
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { orderStatus: status },
      { new: true }
    );

    if (!order) return res.status(404).json({ message: "Order not found." });

    return res.status(200).json({ message: "Order status updated.", order });
  } catch (error) {
    console.error("Update order status error:", error.message);
    return res.status(500).json({ message: "Unable to update order." });
  }
};

// GET /api/admin/users
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    return res.status(200).json({ count: users.length, users });
  } catch (error) {
    console.error("Admin users error:", error.message);
    return res.status(500).json({ message: "Unable to load users." });
  }
};

// POST /api/admin/products
const createProduct = async (req, res) => {
  try {
    const { name, description, category, price, image, stock, featured } = req.body;

    if (!name || !description || !category || price == null || !image) {
      return res.status(400).json({ message: "All required fields must be filled." });
    }

    const product = await Product.create({
      name: name.trim(),
      description: description.trim(),
      category,
      price: Number(price),
      image: image.trim(),
      stock: Number(stock) || 0,
      featured: Boolean(featured),
      isActive: true
    });

    return res.status(201).json({ message: "Product created.", product });
  } catch (error) {
    console.error("Create product error:", error.message);
    return res.status(500).json({ message: "Unable to create product." });
  }
};

// DELETE /api/admin/products/:id
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!product) return res.status(404).json({ message: "Product not found." });

    return res.status(200).json({ message: "Product deactivated." });
  } catch (error) {
    console.error("Delete product error:", error.message);
    return res.status(500).json({ message: "Unable to delete product." });
  }
};

module.exports = {
  getStats,
  getAllOrders,
  updateOrderStatus,
  getAllUsers,
  createProduct,
  deleteProduct
};
