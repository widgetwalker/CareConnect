import "dotenv/config";
import express from "express";
import cors from "cors";
import { auth } from "./auth.js";

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: [
    process.env.CLIENT_URL || "http://localhost:8080",
    "http://localhost:8080",
    "http://localhost:8081",
    "http://localhost:8082",
  ],
  credentials: true,
}));

// Parse JSON body, but keep raw body for auth endpoints
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Better Auth API routes
app.use("/api/auth", async (req, res) => {
  try {
    // Get the protocol (http or https)
    const protocol = req.protocol || 'http';
    const host = req.get('host') || 'localhost:3001';

    // Convert Express request to Fetch API Request
    const url = new URL(req.originalUrl || req.url, `${protocol}://${host}`);

    // Prepare body for Fetch Request
    let body: string | undefined;
    if (req.method !== "GET" && req.method !== "HEAD") {
      // If body is already parsed by express.json(), stringify it
      // Otherwise use raw body if available
      if (req.body !== undefined) {
        body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
      }
    }

    const request = new Request(url.toString(), {
      method: req.method,
      headers: req.headers as HeadersInit,
      body: body,
    });

    // Handle Better Auth request
    const response = await auth.handler(request);

    // Convert Fetch Response to Express response
    const status = response.status;
    const headers = Object.fromEntries(response.headers.entries());
    const bodyText = await response.text();

    // Set headers
    Object.entries(headers).forEach(([key, value]) => {
      res.setHeader(key, value);
    });

    // Set status and send body
    res.status(status).send(bodyText);
  } catch (error: any) {
    console.error("Better Auth handler error:", error);
    if (error && error.stack) console.error(error.stack);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
});

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "better-auth-server" });
});

app.listen(PORT, () => {
  console.log(`🚀 Better Auth server running on http://localhost:${PORT}`);
  console.log(`📡 Auth API available at http://localhost:${PORT}/api/auth`);
});

