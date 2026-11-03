import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import assert from "node:assert/strict";

const submissions = JSON.parse(
  await readFile(resolve("src/data/submissions.json"), "utf8"),
);

const shootAgent = submissions.find((submission) => submission.name === "ShootAgent");

assert.ok(shootAgent, "ShootAgent should be present");
assert.equal(
  shootAgent.demoVideo,
  "https://www.loom.com/share/6a25be5d53fd4257a11cd33498d7630f",
  "ShootAgent's redirect-page demo URL should be overridden with its Loom",
);
assert.equal(
  shootAgent.demoEmbedUrl,
  "https://www.loom.com/embed/6a25be5d53fd4257a11cd33498d7630f",
);

const readyHex = submissions.find((submission) => submission.name === "ReadyHex");
assert.ok(readyHex, "ReadyHex should be renamed from readyhex.com");
assert.equal(readyHex.id, "readyhex", "renamed build should get a matching anchor id");

console.log("Submission override check passed.");
