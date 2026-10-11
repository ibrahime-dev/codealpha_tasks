
"use strict";

const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
      maxlength: 150
    },

    description: {
      type: String,
      required: [true, "Product description is required"],
      trim: true,
      maxlength: 2000
    },

    category: {
      type: String,
      required: [true, "Product category is required"],
      enum: [
        "Electronics",
        "Fashion",
        "Accessories",
        "Home"
      ]
    },

    price: {
      type: Number,
      required: [true, "Product price is required"],
      min: [0, "Price cannot be negative"]
    },

    image: {
      type: String,
      required: [true, "Product image is required"],
      trim: true
    },

    stock: {
      type: Number,
      default: 0,
      min: [0, "Stock cannot be negative"],
      validate: {
        validator: Number.isInteger,
        message: "Stock must be a whole number"
      }
    },

    featured: {
      type: Boolean,
      default: false
    },

    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Product", productSchema);
