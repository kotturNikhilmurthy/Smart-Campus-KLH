import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import passport from "passport";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

import connectDB from "./config/db.js";
import configurePassport from "./config/passport.js";
import authRoutes from "./routes/authRoutes.js";
import apiRoutes from "./routes/apiRoutes.js";
import studentRoutes from "./routes/studentRoutes.js";
import teacherRoutes from "./routes/teacherRoutes.js";
import { notFoundHandler, errorHandler } from "./middleware/errorMiddleware.js";
import { dataMode, isDatabaseEnabled } from "./services/runtimeConfig.js";

dotenv.config();

const app = express();
app.disable("x-powered-by");

const clientOrigins = process.env.CLIENT_URL?.split(",").map((origin) => origin.trim()) || ["http://localhost:3000"];

app.use(helmet());
app.use(
  cors({
    origin: clientOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    maxAge: 600,
  })
);
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

// Note: Static file serving won't work on Vercel serverless - see cloud storage solution below
app.use("/uploads", express.static(path.resolve("uploads")));

configurePassport(passport);
app.use(passport.initialize());

app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Smart Campus API healthy",
    data: { uptime: process.uptime(), mode: dataMode },
  });
});

app.use("/auth", authRoutes);
app.use("/api", apiRoutes);
app.use("/api/student", studentRoutes);
app.use("/api/teacher", teacherRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

// MongoDB connection management for serverless
let isConnected = false;

const ensureDbConnection = async () => {
  if (isDatabaseEnabled && !isConnected) {
    await connectDB();
    isConnected = true;
  }
};

// For Vercel serverless deployment
export default async (req, res) => {
  await ensureDbConnection();
  return app(req, res);
};

const isDirectRun = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];

if (isDirectRun) {
  const port = Number(process.env.PORT || 5000);
  const startServer = async () => {
    try {
      if (isDatabaseEnabled) {
        await connectDB();
      } else {
        console.log("Starting Smart Campus backend in memory mode (database disabled)");
      }

      app.listen(port, () => {
        console.log(`Smart Campus backend running on port ${port}`);
      });
    } catch (error) {
      console.error("Failed to start server", error);
      process.exit(1);
    }
  };

  startServer();
}
