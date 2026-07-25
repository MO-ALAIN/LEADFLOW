import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "../db.js";
import { config } from "../config.js";
import { requireAuth, signSession } from "../auth.js";

export const authRouter = Router();
const loginSchema = z.object({ email: z.email(), password: z.string().min(8) });

authRouter.post("/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Valid email and password are required" });
  const user = await db.user.findUnique({ where: { email: parsed.data.email.toLowerCase() } });
  if (!user || !user.active || !(await bcrypt.compare(parsed.data.password, user.passwordHash))) {
    return res.status(401).json({ error: "Invalid email or password" });
  }
  const sessionUser = { id: user.id, email: user.email, role: user.role, name: user.name };
  res.cookie("session", signSession(sessionUser), {
    httpOnly: true,
    sameSite: config.NODE_ENV === "production" ? "none" : "lax",
    secure: config.NODE_ENV === "production",
    maxAge: 8 * 60 * 60 * 1000
  });
  res.json({ user: sessionUser });
});

authRouter.post("/logout", (_req, res) => {
  res.clearCookie("session");
  res.status(204).send();
});

authRouter.get("/me", requireAuth, (req, res) => res.json({ user: req.user }));
