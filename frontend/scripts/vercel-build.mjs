/**
 * Vercel sometimes truncates logs or fails when npm runs long chained shell scripts.
 * This runner invokes tsc and vite via node for predictable stdout and exit codes.
 */
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
process.chdir(root);

function log(msg) {
  process.stdout.write(`[versos-build] ${msg}\n`);
}

function runNode(scriptPath, args) {
  const r = spawnSync(process.execPath, [scriptPath, ...args], {
    stdio: "inherit",
    env: process.env,
  });
  if (r.status !== 0) {
    process.exit(r.status ?? 1);
  }
}

log(`node=${process.version} cwd=${process.cwd()}`);

const tscJs = path.join(root, "node_modules", "typescript", "lib", "tsc.js");
const viteJs = path.join(root, "node_modules", "vite", "bin", "vite.js");

log("tsc -b");
runNode(tscJs, ["-b", "--pretty", "false"]);

log("vite build");
runNode(viteJs, ["build"]);

log("done");
