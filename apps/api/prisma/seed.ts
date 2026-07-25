import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();
const passwordHash = await bcrypt.hash("DemoPass123!", 12);

await db.user.upsert({
  where: { email: "admin@leadflow.dev" },
  update: {},
  create: { name: "Asha Admin", email: "admin@leadflow.dev", passwordHash, role: Role.ADMIN }
});
await db.user.upsert({
  where: { email: "member@leadflow.dev" },
  update: {},
  create: { name: "Milan Member", email: "member@leadflow.dev", passwordHash, role: Role.MEMBER }
});

console.log("Seeded admin@leadflow.dev and member@leadflow.dev (DemoPass123!)");
await db.$disconnect();
