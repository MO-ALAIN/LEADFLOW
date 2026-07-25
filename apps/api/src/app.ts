import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import helmet from "helmet";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "./config.js";
import { authRouter } from "./routes/auth.js";
import { leadRouter } from "./routes/leads.js";
import { userRouter } from "./routes/users.js";

export const app = express();
app.use(helmet());
app.use(cors({ origin: config.WEB_ORIGIN, credentials: true }));
app.use(express.json({ limit: "100kb" }));
app.use(cookieParser());

app.get("/api/health", (_req, res) => res.json({ status: "ok" }));
app.use("/api/auth", authRouter);
app.use("/api/leads", leadRouter);
app.use("/api/users", userRouter);

if (config.NODE_ENV === "production") {
  const webDist = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "../../web/dist"
  );
  app.use(express.static(webDist));
  app.use((req, res, next) => {
    if (req.method === "GET" && !req.path.startsWith("/api")) {
      return res.sendFile(path.join(webDist, "index.html"));
    }
    next();
  });
}

app.use((_req, res) => res.status(404).json({ error: "Route not found" }));
