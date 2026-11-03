import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import assert from "node:assert/strict";

const submissions = JSON.parse(
  await readFile(resolve("src/data/submissions.json"), "utf8"),
);

for (const submission of submissions) {
  assert.ok(
    !String(submission.demoVideo || "").includes("loom.com/edit/"),
    `${submission.name} should not expose Loom edit URLs`,
  );

  if (submission.demoVideo?.includes("loom.com/")) {
    assert.match(
      submission.demoEmbedUrl,
      /^https:\/\/www\.loom\.com\/embed\/[a-zA-Z0-9]+$/,
      `${submission.name} should have a Loom embed URL`,
    );
    assert.equal(submission.demoProvider, "Loom");
    assert.match(
      submission.demoThumbnailUrl,
      /^https:\/\/cdn\.loom\.com\/sessions\/thumbnails\//,
      `${submission.name} should have a Loom thumbnail URL`,
    );
  }

  if (submission.demoVideo?.includes("drive.google.com/")) {
    assert.match(
      submission.demoEmbedUrl,
      /^https:\/\/drive\.google\.com\/file\/d\/[^/]+\/preview$/,
      `${submission.name} should have a Google Drive preview embed URL`,
    );
    assert.equal(submission.demoProvider, "Google Drive");
    assert.match(
      submission.demoThumbnailUrl,
      /^https:\/\/drive\.google\.com\/thumbnail\?/,
      `${submission.name} should have a Google Drive thumbnail URL`,
    );
  }
}

const paymentIntelligence = submissions.find(
  (submission) => submission.name === "Payment Intelligence",
);
assert.ok(paymentIntelligence, "Payment Intelligence should be present");
assert.equal(
  paymentIntelligence.demoVideo,
  "https://www.youtube.com/watch?v=bzPNRtc_JCA",
);
assert.equal(
  paymentIntelligence.demoEmbedUrl,
  "https://www.youtube.com/embed/bzPNRtc_JCA",
);
assert.equal(paymentIntelligence.demoProvider, "YouTube");

const zetaOnes = submissions.filter((submission) => submission.id === "zeta-one");
assert.equal(zetaOnes.length, 1, "duplicate Zeta One rows should be merged");
assert.ok(
  zetaOnes[0].demoVideo.includes("loom.com/share/"),
  "the merged Zeta One should keep the row with a demo video",
);

const cadence = submissions.find(
  (submission) => submission.name === "L1brary Labs - Cadence on Rho",
);
assert.ok(cadence, "Cadence on Rho should be present");
assert.ok(cadence.demoVideo.endsWith(".mp4"), "Cadence keeps its raw mp4 link");
assert.equal(cadence.demoEmbedUrl, "", "raw mp4 links are not embedded");

console.log("Demo embed check passed.");
