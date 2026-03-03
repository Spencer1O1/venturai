#!/usr/bin/env node
import { spawnSync } from "node:child_process";
/**
 * Read JSON payload from a file and pass it as a single argument to convex run.
 * Invokes the Convex CLI via node (not npx) so the payload is one argv and not
 * split by Windows cmd/npx.
 * Usage: node runConvexAction.mjs <functionName> <payloadFilePath> [cwd]
 */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const argv = process.argv.slice(2);
const pushFirst = argv.includes("--push");
const rest = argv.filter((a) => a !== "--push");
const [functionName, payloadPath, cwdArg] = rest;
const cwd = cwdArg ? path.resolve(cwdArg) : path.resolve(__dirname, "..");

if (!functionName || !payloadPath) {
  console.error(
    "Usage: node runConvexAction.mjs <functionName> <payloadFilePath> [cwd] [--push]",
  );
  process.exit(1);
}

const payload = readFileSync(payloadPath, "utf-8");
const convexBin = path.join(cwd, "node_modules", "convex", "bin", "main.js");
const convexBinRoot = path.join(
  cwd,
  "..",
  "node_modules",
  "convex",
  "bin",
  "main.js",
);
const cliPath = existsSync(convexBin) ? convexBin : convexBinRoot;
if (!existsSync(cliPath)) {
  console.error("Convex CLI not found at", convexBin, "or", convexBinRoot);
  process.exit(1);
}

const runArgs = [cliPath, "run", functionName, payload];
if (pushFirst) runArgs.push("--push");
const run = spawnSync(process.execPath, runArgs, {
  cwd,
  stdio: "inherit",
  env: process.env,
});
process.exit(run.signal ? 1 : run.status === 0 ? 0 : 1);
