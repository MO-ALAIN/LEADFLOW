import { afterAll, beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import bcrypt from "bcryptjs";
import { LeadStatus, Role } from "@prisma/client";
import { app } from "../src/app.js";
import { db } from "../src/db.js";

const password = "DemoPass123!";
let adminId: string;
let memberId: string;
let otherMemberId: string;

async function loginAs(email: string) {
  const agent = request.agent(app);
  const response = await agent.post("/api/auth/login").send({ email, password });
  expect(response.status).toBe(200);
  return agent;
}

beforeEach(async () => {
  await db.activity.deleteMany();
  await db.note.deleteMany();
  await db.lead.deleteMany();
  await db.user.deleteMany();

  const passwordHash = await bcrypt.hash(password, 4);
  const [admin, member, otherMember] = await Promise.all([
    db.user.create({
      data: { name: "Test Admin", email: "admin@test.dev", passwordHash, role: Role.ADMIN }
    }),
    db.user.create({
      data: { name: "Test Member", email: "member@test.dev", passwordHash, role: Role.MEMBER }
    }),
    db.user.create({
      data: { name: "Other Member", email: "other@test.dev", passwordHash, role: Role.MEMBER }
    })
  ]);

  adminId = admin.id;
  memberId = member.id;
  otherMemberId = otherMember.id;
});

afterAll(async () => {
  await db.$disconnect();
});

describe("authentication and permissions", () => {
  it("returns 401 when a protected endpoint has no session", async () => {
    const response = await request(app).get("/api/leads");

    expect(response.status).toBe(401);
    expect(response.body.error).toBe("Authentication required");
  });

  it("only exposes assigned leads to members and blocks reassignment", async () => {
    const assigned = await db.lead.create({
      data: { name: "Assigned Lead", email: "assigned@example.com", assigneeId: memberId }
    });
    const other = await db.lead.create({
      data: { name: "Other Lead", email: "other@example.com", assigneeId: otherMemberId }
    });
    const member = await loginAs("member@test.dev");

    const list = await member.get("/api/leads");
    const forbiddenRead = await member.get(`/api/leads/${other.id}`);
    const forbiddenAssignment = await member
      .patch(`/api/leads/${assigned.id}`)
      .send({ assigneeId: adminId });

    expect(list.status).toBe(200);
    expect(list.body.items).toHaveLength(1);
    expect(list.body.items[0].id).toBe(assigned.id);
    expect(forbiddenRead.status).toBe(403);
    expect(forbiddenAssignment.status).toBe(403);
  });
});

describe("core lead flows", () => {
  it("captures a public inquiry and records its creation activity", async () => {
    const response = await request(app).post("/api/leads/public").send({
      name: "Riya Shah",
      email: "RIYA@example.com",
      company: "Acme",
      message: "We need a better sales process."
    });

    expect(response.status).toBe(201);
    const lead = await db.lead.findUnique({
      where: { id: response.body.lead.id },
      include: { activities: true }
    });
    expect(lead?.email).toBe("riya@example.com");
    expect(lead?.status).toBe(LeadStatus.NEW);
    expect(lead?.activities[0].action).toBe("LEAD_CREATED");
  });

  it("lets an assigned member advance a lead and add a timestamped note", async () => {
    const lead = await db.lead.create({
      data: { name: "Lifecycle Lead", email: "flow@example.com", assigneeId: memberId }
    });
    const member = await loginAs("member@test.dev");

    const statusUpdate = await member
      .patch(`/api/leads/${lead.id}`)
      .send({ status: LeadStatus.CONTACTED });
    const noteCreate = await member
      .post(`/api/leads/${lead.id}/notes`)
      .send({ body: "Called the lead and scheduled a demo." });
    const detail = await member.get(`/api/leads/${lead.id}`);

    expect(statusUpdate.status).toBe(200);
    expect(statusUpdate.body.lead.status).toBe(LeadStatus.CONTACTED);
    expect(noteCreate.status).toBe(201);
    expect(noteCreate.body.note.author.name).toBe("Test Member");
    expect(detail.body.lead.notes[0].body).toContain("scheduled a demo");
    expect(detail.body.lead.activities.map((item: { action: string }) => item.action))
      .toEqual(expect.arrayContaining(["LEAD_UPDATED", "NOTE_ADDED"]));
  });
});
