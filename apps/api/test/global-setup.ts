import { execFileSync } from "node:child_process";
import { rmSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

export default function setup() {
  const apiRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  const prismaCli = path.resolve(apiRoot, "../../node_modules/prisma/build/index.js");
  const testDatabase = path.join(apiRoot, "prisma/test.db");

  rmSync(testDatabase, { force: true });

  execFileSync(
    process.execPath,
    [
      prismaCli,
      "db",
      "push",
      "--schema",
      path.join(apiRoot, "prisma/schema.prisma"),
      "--skip-generate"
    ],
    {
      cwd: apiRoot,
      env: {
        ...process.env,
        DATABASE_URL: "file:./test.db",
        RUST_BACKTRACE: "1",
        RUST_LOG: "info"
      },
      stdio: "inherit"
    }
  );
}
