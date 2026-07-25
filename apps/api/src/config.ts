import { z } from "zod";

const schema = z.object({
  DATABASE_URL: z.string().default("file:./dev.db"),
  JWT_SECRET: z.string().min(32).default("development-secret-change-me-123456"),
  PORT: z.coerce.number().default(4000),
  WEB_ORIGIN: z.string().default("http://localhost:5173"),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development")
});

export const config = schema.parse(process.env);
