import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import assert from "node:assert/strict";

const publicDataPath = resolve("src/data/submissions.json");
const submissions = JSON.parse(await readFile(publicDataPath, "utf8"));
const emailPattern = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;

assert.ok(Array.isArray(submissions), "submissions data should be an array");

for (const [submissionIndex, submission] of submissions.entries()) {
  assert.ok(
    !("teamMembers" in submission),
    `raw teamMembers text was present on submission index ${submissionIndex}`,
  );
  assert.ok(
    Array.isArray(submission.attendees),
    `attendees should be an array on submission index ${submissionIndex}`,
  );

  for (const [attendeeIndex, attendee] of submission.attendees.entries()) {
    assert.equal(
      Object.keys(attendee).sort().join(","),
      "linkedin,name",
      `attendee ${attendeeIndex} on submission ${submissionIndex} should only expose name and linkedin`,
    );
    assert.ok(attendee.name, `attendee ${attendeeIndex} should include a name`);
    assert.ok(
      !emailPattern.test(JSON.stringify(attendee)),
      `attendee ${attendeeIndex} on submission ${submissionIndex} exposed an email`,
    );
    if (attendee.linkedin) {
      assert.match(
        attendee.linkedin,
        /^https:\/\/(www\.)?linkedin\.com\/in\/[^/\s]+\/?$/i,
        `attendee ${attendeeIndex} on submission ${submissionIndex} has invalid LinkedIn URL`,
      );
    }
  }
}

const kestrel = submissions.find((submission) => submission.name === "Kestrel");
assert.ok(kestrel, "Kestrel should be present");
assert.equal(kestrel.attendees.length, 4, "Kestrel should list four attendees");

const paymentIntelligence = submissions.find(
  (submission) => submission.name === "Payment Intelligence",
);
assert.ok(paymentIntelligence, "Payment Intelligence should be present");
assert.equal(
  paymentIntelligence.attendees.find((attendee) => attendee.name === "Rajat Rao")
    ?.linkedin,
  "https://www.linkedin.com/in/rajatsrao/",
  "A LinkedIn URL on its own line should attach to the attendee above it",
);

const shootAgent = submissions.find((submission) => submission.name === "ShootAgent");
assert.ok(shootAgent, "ShootAgent should be present");
for (const attendee of shootAgent.attendees) {
  assert.ok(
    !/linkedin\.com\/in\/(a16z|open-?ai)\//i.test(attendee.linkedin || ""),
    "placeholder LinkedIn slugs should be stripped",
  );
}

console.log(`Public team data check passed for ${submissions.length} submissions.`);
