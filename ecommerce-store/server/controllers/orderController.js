
"use strict";

const mongoose = require("mongoose");
const Order = require("../models/Order");
const Product = require("../models/Product");

// Place a new order for the authenticated customer.
const createOrder = async (req, res) => {
  try {
    const {
      items,
      shippingAddress,
      paymentMethod
    } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        message: "Your order must contain at least one product."
      });
    }

    if (!shippingAddress) {
      return res.status(400).json({
        message: "Shipping information is required."
      });
    }

    const requiredFields = [
      "fullName",
      "address",
      "city",
      "country"
    ];

    for (const field of requiredFields) {
      if (
        typeof shippingAddress[field] !== "string" ||
        !shippingAddress[field].trim()
      ) {
        return res.status(400).json({
          message: `Shipping ${field} is required.`
        });
      }
    }

    if (
      paymentMethod &&
      !["cash_on_delivery", "demo"].includes(paymentMethod)
    ) {
      return res.status(400).json({
        message: "Unsupported payment method."
      });
    }

    // Combine duplicate product IDs and validate quantities.
    const quantities = new Map();

    for (const item of items) {
      if (
        !item ||
        typeof item.productId !== "string" ||
        !mongoose.isValidObjectId(item.productId)
      ) {
        return res.status(400).json({
          message: "An order contains an invalid product ID."
        });
      }

      if (
        !Number.isInteger(item.quantity) ||
        item.quantity < 1 ||
        item.quantity > 100
      ) {
        return res.status(400).json({
          message: "Each product quantity must be between 1 and 100."
        });
      }

      const productId = item.productId;

      quantities.set(
        productId,
        (quantities.get(productId) || 0) + item.quantity
      );
    }

    const productIds = [...quantities.keys()];

    const products = await Product.find({
      _id: { $in: productIds },
      isActive: true
    });

    if (products.length !== productIds.length) {
      return res.status(400).json({
        message: "One or more products are unavailable."
      });
    }

    const orderItems = [];
    let subtotal = 0;

    for (const product of products) {
      const quantity = quantities.get(product._id.toString());

      if (product.stock < quantity) {
        return res.status(400).json({
          message: `Not enough stock for ${product.name}.`
        });
      }

      // Always use the price stored in MongoDB.
      const price = product.price;

      orderItems.push({
        product: product._id,
        name: product.name,
        image: product.image,
        price,
        quantity
      });

      subtotal += price * quantity;
    }

    const shippingCost = subtotal >= 100 ? 0 : 10;
    const total = Number((subtotal + shippingCost).toFixed(2));

    const order = await Order.create({
      user: req.user._id,
      items: orderItems,
      shippingAddress: {
        fullName: shippingAddress.fullName.trim(),
        address: shippingAddress.address.trim(),
        city: shippingAddress.city.trim(),
        postalCode: (shippingAddress.postalCode || "").trim(),
        country: shippingAddress.country.trim(),
        phone: (shippingAddress.phone || "").trim()
      },
      subtotal: Number(subtotal.toFixed(2)),
      shippingCost,
      total,
      paymentMethod: paymentMethod || "cash_on_delivery",
      paymentStatus: "pending",
      orderStatus: "pending"
    });

    // Reduce stock after the order has been saved.
    // If stock changes concurrently, a production system should use
    // a database transaction or an atomic stock-reservation operation.
    for (const product of products) {
      const quantity = quantities.get(product._id.toString());

      const updatedProduct = await Product.findOneAndUpdate(
        {
          _id: product._id,
          isActive: true,
          stock: { $gte: quantity }
        },
        {
          $inc: { stock: -quantity }
        },
        {
          new: true
        }
      );

      if (!updatedProduct) {
        // Restore the stock already deducted during this request.
        for (const deductedProduct of products) {
          if (deductedProduct._id.equals(product._id)) break;

          const deductedQuantity = quantities.get(
            deductedProduct._id.toString()
          );

          await Product.updateOne(
            { _id: deductedProduct._id },
            { $inc: { stock: deductedQuantity } }
          );
        }

        await Order.findByIdAndDelete(order._id);

        return res.status(409).json({
          message: "Stock changed during checkout. Please try again."
        });
      }
    }

    return res.status(201).json({
      message: "Order placed successfully.",
      order
    });
  } catch (error) {
    console.error("Create order error:", error.message);

    return res.status(500).json({
      message: "Unable to place your order."
    });
  }
};

// Get the authenticated customer's order history.
const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({
      user: req.user._id
    }).sort({
      createdAt: -1
    });

    return res.status(200).json({
      count: orders.length,
      orders
    });
  } catch (error) {
    console.error("Get orders error:", error.message);

    return res.status(500).json({
      message: "Unable to retrieve your orders."
    });
  }
};

module.exports = {
  createOrder,
  getMyOrders
};
