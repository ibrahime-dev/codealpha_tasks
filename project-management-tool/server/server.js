import "dotenv/config";
import { fileURLToPath } from "node:url";
import path from "node:path";
import cors from "cors";
import express from "express";
import mongoose from "mongoose";
import connectDB from "./config/db.js";
import loadConfig from "./config/env.js";
import handleError from "./middleware/errorMiddleware.js";
import authRoutes from "./routes/authRoutes.js";
import commentRoutes from "./routes/commentRoutes.js";
import projectRoutes from "./routes/projectRoutes.js";
import taskRoutes from "./routes/taskRoutes.js";

const app = express();
const config = loadConfig(process.env);
const clientDirectory = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../client"
);

app.disable("x-powered-by");
app.use(
  "/api",
  cors({
    origin(origin, callback) {
      if (!origin || config.clientOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(null, false);
    }
  })
);
app.use(express.json({ limit: "10kb" }));

app.get("/api/health", (req, res) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ message: "TaskFlow API is not ready: database disconnected." });
  }

  return res.status(200).json({ message: "TaskFlow API is running." });
});

app.get("/api/health/live", (req, res) => {
  return res.status(200).json({ status: "alive" });
});

app.get("/api/health/ready", (req, res) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ status: "not_ready", database: "disconnected" });
  }

  return res.status(200).json({ status: "ready", database: "connected" });
});

app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/tasks", commentRoutes);

app.use("/api", (req, res) => {
  return res.status(404).json({ message: "API route not found." });
});

app.get("/runtime-config.js", (req, res) => {
  res
    .set("Cache-Control", "no-store")
    .type("application/javascript")
    .send(
      `window.TASKFLOW_CONFIG = Object.freeze({ apiBaseUrl: ${JSON.stringify(config.publicApiBaseUrl)} });`
    );
});

app.use(express.static(clientDirectory, { index: "index.html" }));

app.get("*", (req, res, next) => {
  if (req.method !== "GET" || !req.accepts("html")) {
    return next();
  }

  return res.sendFile(path.join(clientDirectory, "index.html"));
});

app.use(handleError);

const startServer = async () => {
  await connectDB(config);

  let server;
  try {
    server = await new Promise((resolve, reject) => {
      const listener = app.listen(config.port, config.host, () => resolve(listener));
      listener.once("error", reject);
    });
  } catch (error) {
    try {
      await mongoose.disconnect();
    } catch (disconnectError) {
      console.error("MongoDB cleanup after startup failure also failed:", disconnectError);
    }

    throw error;
  }

  console.log(`TaskFlow listening on http://${config.host}:${config.port}`);
  mongoose.connection.on("disconnected", () => {
    console.error("MongoDB disconnected; TaskFlow readiness is failing until the driver reconnects.");
  });
  mongoose.connection.on("reconnected", () => {
    console.log("MongoDB connection restored.");
  });
  let isShuttingDown = false;

  const shutdown = async (signal) => {
    if (isShuttingDown) {
      return;
    }

    isShuttingDown = true;
    console.log(`${signal} received; closing TaskFlow gracefully.`);
    const forceCloseTimer = setTimeout(() => {
      console.error("Timed out waiting for HTTP connections to close.");
      server.closeAllConnections();
    }, 10000);
    forceCloseTimer.unref();

    try {
      await new Promise((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      });
      await mongoose.disconnect();
      clearTimeout(forceCloseTimer);
      console.log("TaskFlow shutdown complete.");
    } catch (error) {
      console.error("TaskFlow shutdown failed:", error);
      process.exitCode = 1;
    }
  };

  process.once("SIGINT", () => void shutdown("SIGINT"));
  process.once("SIGTERM", () => void shutdown("SIGTERM"));
};

startServer().catch((error) => {
  console.error(
    "TaskFlow API failed to start:",
    error instanceof Error ? error.message : String(error)
  );
  if (error?.code === "EADDRINUSE") {
    console.error(`Port ${config.port} is already in use. Stop the existing TaskFlow process or configure another PORT.`);
  }
  process.exitCode = 1;
});
