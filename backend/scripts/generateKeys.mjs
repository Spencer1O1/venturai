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

// Output PEM with newlines - Convex requires proper PKCS#8 format.
// Paste the entire block into JWT_PRIVATE_KEY, preserving newlines.
process.stdout.write("=== JWT_PRIVATE_KEY ===\n");
process.stdout.write(privateKey.trimEnd());
process.stdout.write("\n\n=== JWKS ===\n");
process.stdout.write(jwks);
process.stdout.write("\n");
