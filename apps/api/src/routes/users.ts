import { Role } from "@prisma/client";
import { Router } from "express";
import { requireAuth, requireRole } from "../auth.js";
import { db } from "../db.js";

export const userRouter = Router();
userRouter.use(requireAuth, requireRole(Role.ADMIN));
userRouter.get("/", async (_req, res) => {
  const users = await db.user.findMany({
    where: { active: true },
    select: { id: true, name: true, email: true, role: true },
    orderBy: { name: "asc" }
  });
  res.json({ users });
});
