
"use strict";

const mongoose = require("mongoose");
const Product = require("../models/Product");

// Get all active products, with optional search and category filters.
const getProducts = async (req, res) => {
  try {
    const { search, category, featured } = req.query;

    const filter = {
      isActive: true
    };

    if (category) {
      filter.category = category;
    }

    if (featured === "true") {
      filter.featured = true;
    }

    if (search && search.trim()) {
      const escapedSearch = search
        .trim()
        .replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

      filter.$or = [
        { name: { $regex: escapedSearch, $options: "i" } },
        { description: { $regex: escapedSearch, $options: "i" } }
      ];
    }

    const products = await Product.find(filter).sort({
      createdAt: -1
    });

    return res.status(200).json({
      count: products.length,
      products
    });
  } catch (error) {
    console.error("Get products error:", error.message);

    return res.status(500).json({
      message: "Unable to retrieve products."
    });
  }
};

// Get one active product by its MongoDB ID.
const getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        message: "Invalid product ID."
      });
    }

    const product = await Product.findOne({
      _id: id,
      isActive: true
    });

    if (!product) {
      return res.status(404).json({
        message: "Product not found."
      });
    }

    return res.status(200).json({ product });
  } catch (error) {
    console.error("Get product error:", error.message);

    return res.status(500).json({
      message: "Unable to retrieve the product."
    });
  }
};

module.exports = {
  getProducts,
  getProductById
};
