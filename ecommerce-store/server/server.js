
"use strict";

require("dotenv").config();

const express = require("express");
const cors = require("cors");

const connectDB = require("./config/db");

const authRoutes    = require("./routes/authRoutes");
const productRoutes = require("./routes/productRoutes");
const orderRoutes   = require("./routes/orderRoutes");
const adminRoutes   = require("./routes/adminRoutes");

const app = express();

const PORT = process.env.PORT || 5000;

// Required configuration checks.
if (!process.env.MONGODB_URI) {
  console.error("Missing MONGODB_URI in your .env file.");
  process.exit(1);
}

if (!process.env.JWT_SECRET) {
  console.error("Missing JWT_SECRET in your .env file.");
  process.exit(1);
}

// CORS — allow the local frontend origins in development.
// Set ALLOWED_ORIGINS in .env for production (comma-separated).
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",").map((o) => o.trim())
  : [
      "http://localhost:5500",   // VS Code Live Server default
      "http://127.0.0.1:5500",
      "http://localhost:3000",
      "http://127.0.0.1:3000",
      "null"                     // file:// origin (opening HTML directly)
    ];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (curl, Postman, same-origin)
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      callback(new Error(`CORS: origin '${origin}' is not allowed.`));
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true
  })
);

app.use(express.json({ limit: "10kb" }));

// Basic health-check endpoint.
app.get("/", (req, res) => {
  res.status(200).json({
    message: "Welcome to the ShopEase API!",
    status: "running"
  });
});

app.use("/api/auth",     authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders",   orderRoutes);
app.use("/api/admin",    adminRoutes);

// Handle unknown API routes.
app.use((req, res) => {
  res.status(404).json({
    message: "API endpoint not found."
  });
});

// Handle unexpected errors.
app.use((error, req, res, next) => {
  console.error("Server error:", error.message);

  if (res.headersSent) {
    return next(error);
  }

  res.status(500).json({
    message: "An unexpected server error occurred."
  });
});

// Connect to MongoDB before accepting requests.
const startServer = async () => {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(`ShopEase API running at http://localhost:${PORT}`);
      console.log("Press Ctrl + C to stop the server.");
    });
  } catch (error) {
    console.error("Server startup failed. Check your MongoDB connection.");
    process.exit(1);
  }
};

startServer();
