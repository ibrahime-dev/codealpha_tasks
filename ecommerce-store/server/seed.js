"use strict";

/**
 * Seed script — populates the ShopEase database with products.
 * Run once:  node seed.js
 * Re-seed:   node seed.js --fresh   (wipes existing products first)
 */

require("dotenv").config();
const mongoose = require("mongoose");
const Product  = require("./models/Product");

const FRESH = process.argv.includes("--fresh");

const products = [
  {
    name:        "Studio Wireless Headphones",
    description: "Enjoy rich, clear audio with Studio Wireless Headphones. Designed for all-day comfort — perfect for work, studying, or relaxing.",
    category:    "Electronics",
    price:       79.00,
    image:       "images/headphones.jpg",
    stock:       25,
    featured:    true
  },
  {
    name:        "Everyday Classic Sneakers",
    description: "Step out in style with Everyday Classic Sneakers. Their versatile design makes them a great choice for casual outfits and everyday adventures.",
    category:    "Fashion",
    price:       64.00,
    image:       "images/sneakers.jpg",
    stock:       40,
    featured:    true
  },
  {
    name:        "Minimal Ceramic Table Lamp",
    description: "Create a warm and welcoming atmosphere with this minimal ceramic table lamp. Complements any bedroom, living room, or workspace.",
    category:    "Home",
    price:       48.00,
    image:       "images/lamp.jpg",
    stock:       15,
    featured:    true
  },
  {
    name:        "Timeless Everyday Backpack",
    description: "Carry your daily essentials in style. A versatile bag for work, shopping, and daily adventures.",
    category:    "Fashion",
    price:       55.00,
    image:       "images/handbags.jpg",
    stock:       30,
    featured:    true
  },
  {
    name:        "Wireless Earbuds",
    description: "Compact wireless earbuds with crisp sound and a secure fit. Great for commuting, workouts, and calls.",
    category:    "Electronics",
    price:       29.99,
    image:       "images/earbuds.jpg",
    stock:       50,
    featured:    false
  },
  {
    name:        "Digital Camera",
    description: "Capture every moment in crisp, vivid detail. Lightweight design with intuitive controls for beginners and enthusiasts.",
    category:    "Electronics",
    price:       199.99,
    image:       "images/camera.jpg",
    stock:       10,
    featured:    false
  },
  {
    name:        "Bluetooth Speaker",
    description: "Portable speaker with rich, 360° sound. Water-resistant and built for indoor and outdoor use.",
    category:    "Electronics",
    price:       39.99,
    image:       "images/speaker.jpg",
    stock:       35,
    featured:    false
  },
  {
    name:        "Premium Headphones",
    description: "Over-ear headphones delivering immersive sound with noise isolation. Foldable for easy carrying.",
    category:    "Electronics",
    price:       59.99,
    image:       "images/head-phones.jpg",
    stock:       20,
    featured:    false
  },
  {
    name:        "Smartwatch",
    description: "Stay connected and track your wellness with a sleek, modern smartwatch. Compatible with iOS and Android.",
    category:    "Electronics",
    price:       79.99,
    image:       "images/smartwatch.jpg",
    stock:       18,
    featured:    false
  },
  {
    name:        "Smartwatch Series Pro",
    description: "Next-generation smartwatch with advanced health tracking, GPS, and a vivid always-on display.",
    category:    "Electronics",
    price:       89.99,
    image:       "images/smartwatchs.jpg",
    stock:       12,
    featured:    false
  },
  {
    name:        "Running Sneakers",
    description: "Lightweight running sneakers built for performance and comfort on any surface.",
    category:    "Fashion",
    price:       59.99,
    image:       "images/sneakers-a.jpg",
    stock:       45,
    featured:    false
  },
  {
    name:        "Running Shoes",
    description: "Supportive running shoes with cushioned soles for long-distance comfort.",
    category:    "Fashion",
    price:       74.99,
    image:       "images/running-shoes.jpg",
    stock:       28,
    featured:    false
  },
  {
    name:        "Casual T-shirt",
    description: "A classic everyday tee in a relaxed, comfortable fit. Versatile enough for any casual occasion.",
    category:    "Fashion",
    price:       19.99,
    image:       "images/tshirt.jpg",
    stock:       100,
    featured:    false
  },
  {
    name:        "Leather Handbag",
    description: "Genuine leather handbag with a timeless silhouette and spacious interior. A wardrobe staple.",
    category:    "Accessories",
    price:       44.99,
    image:       "images/handbag.jpg",
    stock:       22,
    featured:    false
  },
  {
    name:        "Fashion Handbag",
    description: "Modern handbag with clean lines that pairs with any outfit — from office to weekend.",
    category:    "Accessories",
    price:       49.99,
    image:       "images/handbags.jpg",
    stock:       20,
    featured:    false
  },
  {
    name:        "Coffee Mug",
    description: "A cosy, generously sized mug for your morning ritual. Microwave and dishwasher safe.",
    category:    "Home",
    price:       12.99,
    image:       "images/mug.jpg",
    stock:       80,
    featured:    false
  },
  {
    name:        "Minimal Classic Watch",
    description: "A timeless everyday watch with a clean, versatile design. Goes from morning to evening effortlessly.",
    category:    "Accessories",
    price:       49.99,
    image:       "images/watch.jpg",
    stock:       25,
    featured:    false
  }
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB.");

    if (FRESH) {
      await Product.deleteMany({});
      console.log("Cleared existing products.");
    }

    const existing = await Product.countDocuments();
    if (existing > 0 && !FRESH) {
      console.log(`DB already has ${existing} products. Use --fresh to re-seed.`);
      process.exit(0);
    }

    const inserted = await Product.insertMany(products);
    console.log(`✓ Seeded ${inserted.length} products successfully.`);

    // Print a sample so you can copy IDs for testing
    console.log("\nSample products (copy these IDs for testing):");
    inserted.slice(0, 4).forEach((p) => {
      console.log(`  ${p._id}  ${p.name}  $${p.price}`);
    });

    process.exit(0);
  } catch (error) {
    console.error("Seed failed:", error.message);
    process.exit(1);
  }
}

seed();
