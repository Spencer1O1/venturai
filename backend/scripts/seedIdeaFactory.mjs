#!/usr/bin/env node

/**
 * Seed USU Idea Factory with real photos and AI evaluation.
 *
 * Prerequisites:
 * - CONVEX_URL in .env.local (loaded automatically) or in the environment
 * - OPENAI_API_KEY set in Convex dashboard (Settings → Environment Variables) for the action
 * - Image files under repo root: data/usu/idea_factory/<asset_folder>/*.jpg
 *
 * Flow:
 * 1. Run seedIdeaFactoryStructure mutation (org, groups, template, assets, seed user as owner).
 * 2. For each asset, upload each image to Convex storage.
 * 3. Run runAllAssessmentsForSeed in batches of 4 (real AI analysis).
 *
 * Run from repo root: pnpm run seed:idea-factory
 * Or from backend: pnpm run seed:idea-factory
 */

import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ConvexHttpClient } from "convex/browser";

import { api } from "../convex/_generated/api.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendDir = path.resolve(__dirname, "..");
const repoRoot = path.resolve(backendDir, "..");

function loadEnvLocal() {
  for (const dir of [backendDir, repoRoot]) {
    const file = path.join(dir, ".env.local");
    if (!existsSync(file)) continue;
    const content = readFileSync(file, "utf-8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq <= 0) continue;
      const key = trimmed.slice(0, eq).trim();
      if (!key) continue;
      let value = trimmed.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      value = value.trim();
      if (!process.env[key]) process.env[key] = value;
    }
    return;
  }
}

loadEnvLocal();

const CONVEX_URL = process.env.CONVEX_URL?.trim();
if (!CONVEX_URL) {
  console.error(
    "CONVEX_URL is required. Set it in backend/.env.local or repo root .env.local.",
  );
  process.exit(1);
}

for (const dir of [backendDir, repoRoot]) {
  const envPath = path.join(dir, ".env.local");
  if (!existsSync(envPath)) continue;
  const raw = readFileSync(envPath, "utf-8");
  const bad = raw
    .split("\n")
    .map((line) => {
      const eq = line.indexOf("=");
      if (eq <= 0) return null;
      const val = line.slice(eq + 1).trim();
      const hasLeading = line[eq + 1] === " " || line[eq + 1] === "\t";
      if (hasLeading || (val && (val.startsWith(" ") || val.endsWith(" ")))) {
        return line.slice(0, eq).trim();
      }
      return null;
    })
    .filter(Boolean);
  if (bad.length > 0) {
    console.error(
      "In " +
        envPath +
        " the following env vars have a space after = or in the value. " +
        "Edit the file and remove the space so the Convex CLI gets a valid deployment name:\n  " +
        bad.join(", "),
    );
    process.exit(1);
  }
  break;
}

const client = new ConvexHttpClient(CONVEX_URL);

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: It's just a seed i dont care if it is complex
async function main() {
  console.log("1. Creating org, groups, template, and assets...");
  const result = await client.mutation(api.seed.seedIdeaFactoryStructure, {});
  console.log(
    `   Created org ${result.orgId}, ${result.assetCount} assets in ${result.maintenanceGroupCount} groups.`,
  );

  console.log("\n1b. Creating seed user idea@mail.com and adding as org owner...");
  const signInPayloadFile = path.join(
    tmpdir(),
    `venturai-seed-signin-${process.pid}.json`,
  );
  writeFileSync(
    signInPayloadFile,
    JSON.stringify({
      provider: "password",
      params: {
        flow: "signUp",
        email: "idea@mail.com",
        password: "password",
      },
    }),
    "utf-8",
  );
  try {
    const runSignIn = spawnSync(
      "node",
      [
        path.join(__dirname, "runConvexAction.mjs"),
        "auth:signIn",
        signInPayloadFile,
        backendDir,
        "--push",
      ],
      { encoding: "utf-8", env: process.env, stdio: "inherit" },
    );
    if (runSignIn.status !== 0 || runSignIn.signal) {
      throw new Error(
        `auth:signIn (signUp) failed (exit ${runSignIn.status ?? "null"}${runSignIn.signal ? `, signal ${runSignIn.signal}` : ""}).`,
      );
    }
  } finally {
    try {
      unlinkSync(signInPayloadFile);
    } catch (_) {}
  }
  const userId = await client.query(api.auth_helpers.getUserIdByEmail, {
    email: "idea@mail.com",
  });
  if (!userId) {
    throw new Error(
      "Seed user not found after signUp; getUserIdByEmail returned null.",
    );
  }
  await client.mutation(api.migrations.addOwnerToOrphanedOrg, {
    orgId: result.orgId,
    userId,
  });
  console.log("   idea@mail.com is owner (password: password).");

  const templatePhotoDescriptions = [
    "Wide machine view",
    "Close-up of wear/fault area",
    "Control panel and safety elements",
  ];

  const assetsPayload = [];

  for (let i = 0; i < result.assets.length; i++) {
    const asset = result.assets[i];
    console.log(`\n2. Asset ${i + 1}/${result.assets.length}: ${asset.name}`);

    const photoStorageIds = [];
    for (const imagePath of asset.imagePaths) {
      const fullPath = path.join(repoRoot, imagePath);
      if (!existsSync(fullPath)) {
        console.warn(`   Skip (file not found): ${imagePath}`);
        continue;
      }
      const buffer = readFileSync(fullPath);
      const uploadUrl = await client.mutation(
        api.storage.generateUploadUrl,
        {},
      );
      const res = await fetch(uploadUrl, {
        method: "POST",
        body: buffer,
        headers: { "Content-Type": "image/jpeg" },
      });
      if (!res.ok) {
        throw new Error(`Upload failed ${res.status}: ${imagePath}`);
      }
      const json = await res.json();
      if (!json.storageId) throw new Error("No storageId in upload response");
      photoStorageIds.push(json.storageId);
    }

    if (photoStorageIds.length === 0) {
      console.warn(`   No photos uploaded for ${asset.name}; skipping.`);
      continue;
    }

    console.log(`   Uploaded ${photoStorageIds.length} photo(s).`);
    assetsPayload.push({
      assetId: asset.assetId,
      photoStorageIds,
      photoDescriptions:
        asset.photoDescriptions.length > 0
          ? asset.photoDescriptions
          : templatePhotoDescriptions.slice(0, photoStorageIds.length),
      answers: asset.answers,
      notes: asset.notes ?? `Seeded from ${asset.imagePaths[0] ?? "images"}`,
      intent: asset.intent,
    });
  }

  if (assetsPayload.length === 0) {
    throw new Error("No assets had photos uploaded; cannot run AI.");
  }

  const BATCH_SIZE = 4;
  const convexEnv = {};
  for (const k of Object.keys(process.env)) {
    if (k.startsWith("CONVEX_") && process.env[k] != null) {
      convexEnv[k] = String(process.env[k]).trim();
    }
  }

  for (let b = 0; b < assetsPayload.length; b += BATCH_SIZE) {
    const batch = assetsPayload.slice(b, b + BATCH_SIZE);
    const batchNum = Math.floor(b / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(assetsPayload.length / BATCH_SIZE);
    console.log(
      `\n3. Running AI for assets ${b + 1}-${b + batch.length} of ${assetsPayload.length} (batch ${batchNum}/${totalBatches})...`,
    );
    const payloadFile = path.join(
      tmpdir(),
      `venturai-seed-payload-${process.pid}-${b}.json`,
    );
    writeFileSync(payloadFile, JSON.stringify({ assets: batch }), "utf-8");
    try {
      const run = spawnSync(
        "node",
        [
          path.join(__dirname, "runConvexAction.mjs"),
          "assessments/actions:runAllAssessmentsForSeed",
          payloadFile,
          backendDir,
          ...(b === 0 ? ["--push"] : []),
        ],
        {
          encoding: "utf-8",
          env: { ...process.env, ...convexEnv },
          stdio: "inherit",
        },
      );
      if (run.status !== 0 || run.signal) {
        throw new Error(
          `runAllAssessmentsForSeed failed (exit ${run.status ?? "null"}${run.signal ? `, signal ${run.signal}` : ""}). Check output above.`,
        );
      }
    } finally {
      try {
        unlinkSync(payloadFile);
      } catch (_) {}
    }
  }

  console.log(
    "\nDone. Dashboard now has real photos and AI-derived work items.",
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
