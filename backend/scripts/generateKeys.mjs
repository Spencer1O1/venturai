#!/usr/bin/env node
/**
 * Generate JWT keys for Convex Auth.
 * Run: node backend/scripts/generateKeys.mjs
 *
 * Copy the output and paste into Convex Dashboard:
 * Settings → Environment Variables
 *
 * Add each variable (JWT_PRIVATE_KEY, JWKS) from the output.
 */
import { exportJWK, exportPKCS8, generateKeyPair } from "jose";

const keys = await generateKeyPair("RS256", {
  extractable: true,
});
const privateKey = await exportPKCS8(keys.privateKey);
const publicKey = await exportJWK(keys.publicKey);
const jwks = JSON.stringify({ keys: [{ use: "sig", ...publicKey }] });

process.stdout.write(
  `JWT_PRIVATE_KEY="${privateKey.trimEnd().replace(/\n/g, " ")}"`,
);
process.stdout.write("\n");
process.stdout.write(`JWKS=${jwks}`);
process.stdout.write("\n");
