import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import assert from "node:assert/strict";

const appSource = await readFile(resolve("src/App.tsx"), "utf8");

for (const requiredText of [
  "MLOps World Tech Week Hackathon Showcase",
  "Sponsored Tracks",
  "Days of Building",
  "Winning Builds",
  "Ocypod",
  "Payment Intelligence",
  "ShootAgent",
  "Antler Agents Track",
  "Rho Fintech Track",
  "AutoHDR Image Models & Pipelines Track",
]) {
  assert.ok(appSource.includes(requiredText), `missing homepage copy: ${requiredText}`);
}

for (const staleText of [
  "Codex",
  "Total Tokens Used",
  "Bounties",
  "bounty",
  "HeroVideo",
  "hackathon-hype",
]) {
  assert.ok(!appSource.includes(staleText), `stale homepage copy: ${staleText}`);
}

console.log("Homepage content check passed.");
