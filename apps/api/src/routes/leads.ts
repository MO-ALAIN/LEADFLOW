import { LeadStatus, Role } from "@prisma/client";
import { Router } from "express";
import { z } from "zod";
import { requireAuth, requireRole } from "../auth.js";
import { db } from "../db.js";

export const leadRouter = Router();

const captureSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.email(),
  phone: z.string().trim().max(30).optional(),
  company: z.string().trim().max(100).optional(),
  message: z.string().trim().max(1000).optional()
});

leadRouter.post("/public", async (req, res) => {
  const parsed = captureSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Please check the submitted fields", issues: parsed.error.issues });
  const lead = await db.lead.create({
    data: {
      ...parsed.data,
      email: parsed.data.email.toLowerCase(),
      activities: { create: { action: "LEAD_CREATED", details: "Submitted through public form" } }
    },
    select: { id: true, createdAt: true }
  });
  res.status(201).json({ lead });
});

leadRouter.use(requireAuth);

leadRouter.get("/", async (req, res) => {
  const query = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
    status: z.enum(LeadStatus).optional(),
    assigneeId: z.string().optional(),
    search: z.string().trim().optional()
  }).safeParse(req.query);
  if (!query.success) return res.status(400).json({ error: "Invalid query parameters" });
  const { page, limit, status, assigneeId, search } = query.data;
  const access = req.user!.role === Role.ADMIN ? {} : { assigneeId: req.user!.id };
  const where = {
    ...access,
    ...(status ? { status } : {}),
    ...(assigneeId && req.user!.role === Role.ADMIN ? { assigneeId } : {}),
    ...(search ? { OR: [{ name: { contains: search } }, { email: { contains: search } }, { company: { contains: search } }] } : {})
  };
  const [items, total] = await db.$transaction([
    db.lead.findMany({
      where, skip: (page - 1) * limit, take: limit, orderBy: { createdAt: "desc" },
      include: { assignee: { select: { id: true, name: true, email: true } }, _count: { select: { notes: true } } }
    }),
    db.lead.count({ where })
  ]);
  res.json({ items, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
});

leadRouter.get("/:id", async (req, res) => {
  const lead = await db.lead.findUnique({
    where: { id: req.params.id },
    include: {
      assignee: { select: { id: true, name: true, email: true } },
      notes: { include: { author: { select: { id: true, name: true } } }, orderBy: { createdAt: "desc" } },
      activities: { include: { actor: { select: { id: true, name: true } } }, orderBy: { createdAt: "desc" } }
    }
  });
  if (!lead) return res.status(404).json({ error: "Lead not found" });
  if (req.user!.role !== Role.ADMIN && lead.assigneeId !== req.user!.id) return res.status(403).json({ error: "Forbidden" });
  res.json({ lead });
});

leadRouter.patch("/:id", async (req, res) => {
  const parsed = z.object({ status: z.enum(LeadStatus).optional(), assigneeId: z.string().nullable().optional() }).safeParse(req.body);
  if (!parsed.success || (!parsed.data.status && parsed.data.assigneeId === undefined)) return res.status(400).json({ error: "Invalid update" });
  const current = await db.lead.findUnique({ where: { id: req.params.id } });
  if (!current) return res.status(404).json({ error: "Lead not found" });
  if (req.user!.role !== Role.ADMIN && current.assigneeId !== req.user!.id) return res.status(403).json({ error: "Forbidden" });
  if (parsed.data.assigneeId !== undefined && req.user!.role !== Role.ADMIN) return res.status(403).json({ error: "Only admins can assign leads" });
  const changes = [];
  if (parsed.data.status && parsed.data.status !== current.status) changes.push(`Status: ${current.status} → ${parsed.data.status}`);
  if (parsed.data.assigneeId !== undefined && parsed.data.assigneeId !== current.assigneeId) changes.push("Assignee changed");
  const lead = await db.lead.update({
    where: { id: current.id },
    data: {
      ...parsed.data,
      activities: { create: { action: "LEAD_UPDATED", details: changes.join("; "), actorId: req.user!.id } }
    }
  });
  res.json({ lead });
});

leadRouter.post("/:id/notes", async (req, res) => {
  const parsed = z.object({ body: z.string().trim().min(1).max(2000) }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Note cannot be empty" });
  const lead = await db.lead.findUnique({ where: { id: req.params.id } });
  if (!lead) return res.status(404).json({ error: "Lead not found" });
  if (req.user!.role !== Role.ADMIN && lead.assigneeId !== req.user!.id) return res.status(403).json({ error: "Forbidden" });
  const note = await db.note.create({
    data: { body: parsed.data.body, leadId: lead.id, authorId: req.user!.id },
    include: { author: { select: { id: true, name: true } } }
  });
  await db.activity.create({ data: { leadId: lead.id, actorId: req.user!.id, action: "NOTE_ADDED" } });
  res.status(201).json({ note });
});

leadRouter.delete("/:id", requireRole(Role.ADMIN), async (req, res) => {
  const id = String(req.params.id);
  const found = await db.lead.findUnique({ where: { id } });
  if (!found) return res.status(404).json({ error: "Lead not found" });
  await db.lead.delete({ where: { id: found.id } });
  res.status(204).send();
});
