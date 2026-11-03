import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const csvPath = process.env.SUBMISSIONS_CSV
  ? resolve(process.env.SUBMISSIONS_CSV)
  : "/Users/jakeoshea/Downloads/Submissions-MLOps & AITX Tech Week Submissions.csv";
const outputPath = resolve("src/data/submissions.json");

try {
  await access(csvPath);
} catch {
  console.log(
    `prepare-data: CSV not found at ${csvPath}, using existing ${outputPath}`,
  );
  process.exit(0);
}

const submissionOverrides = new Map([
  [
    "ShootAgent",
    {
      // The submitted URL is a redirect page on the team's domain; this is
      // the Loom it embeds.
      demoVideo: "https://www.loom.com/share/6a25be5d53fd4257a11cd33498d7630f",
    },
  ],
  [
    "readyhex.com",
    {
      name: "ReadyHex",
    },
  ],
  [
    "Promptforce Maya",
    {
      // CSV has a misspelled LinkedIn domain that defeats the parser.
      attendees: [
        {
          name: "Kunal Vasavada",
          linkedin: "https://linkedin.com/in/kunalvasavada/",
        },
      ],
    },
  ],
  [
    "Plans Guru",
    {
      // CSV lists emails only.
      attendees: [
        { name: "Shawn David", linkedin: "" },
        { name: "Brian Carrozza", linkedin: "" },
      ],
    },
  ],
  [
    "DevLens",
    {
      // CSV lists the name as "Yeruva, Uma Maheswar Reddy" across lines.
      attendees: [
        {
          name: "Uma Maheswar Reddy Yeruva",
          linkedin: "https://www.linkedin.com/in/umamaheswarreddy-yeruva/",
        },
      ],
    },
  ],
]);

// LinkedIn slugs submitted as jokes/placeholders; linking them would point at
// unrelated profiles.
const LINKEDIN_SLUG_BLOCKLIST = new Set(["a16z", "open-ai", "openai"]);

function parseCsv(input) {
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;

  for (let index = 0; index < input.length; index += 1) {
    const char = input[index];
    const next = input[index + 1];

    if (quoted) {
      if (char === '"' && next === '"') {
        cell += '"';
        index += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        cell += char;
      }
      continue;
    }

    if (char === '"') {
      quoted = true;
    } else if (char === ",") {
      row.push(cell);
      cell = "";
    } else if (char === "\n") {
      row.push(cell.replace(/\r$/, ""));
      rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }

  if (cell.length > 0 || row.length > 0) {
    row.push(cell.replace(/\r$/, ""));
    rows.push(row);
  }

  return rows;
}

function splitList(value) {
  return value
    .split(/[,;\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeTrack(track) {
  if (/autohdr/i.test(track)) return "AutoHDR";
  if (/rho|fintech/i.test(track)) return "Rho Fintech";
  if (/antler|agents/i.test(track)) return "Antler Agents";
  return track.replace(/\s*Track$/i, "").trim();
}

const SECRET_PATTERNS = [
  /\bsk-(?:proj|live|ant|test|svcacct)[-_A-Za-z0-9]{20,}\b/gi,
  /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}:[0-9a-f]{16,}\b/gi,
  /\b(?:Fal|OpenAI|Anthropic|Producton)\s*(?:API\s*)?Key[:\s]+\S+/gi,
];

function redactSecrets(value) {
  let result = String(value || "");
  for (const pattern of SECRET_PATTERNS) {
    result = result.replace(pattern, "");
  }
  return result;
}

function cleanText(value) {
  return redactSecrets(value)
    .replace(/\s+/g, " ")
    .trim();
}

// Some teams pasted markdown READMEs as their description; flatten the
// syntax so cards read as prose.
function cleanDescription(value) {
  return cleanText(
    String(value || "")
      .replace(/^#{1,6}\s+/gm, "")
      .replace(/\*\*([^*]+)\*\*/g, "$1")
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1")
      .replace(/`([^`]+)`/g, "$1"),
  );
}

function slugify(value) {
  return cleanText(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function normalizeDemoVideo(value) {
  const url = cleanText(value);
  const loomMatch = url.match(/loom\.com\/(?:share|edit)\/([a-zA-Z0-9]+)/);
  if (loomMatch) return `https://www.loom.com/share/${loomMatch[1]}`;
  const youtubeId = youtubeVideoId(url);
  if (youtubeId) return `https://www.youtube.com/watch?v=${youtubeId}`;
  if (/^tba$/i.test(url)) return "";
  return url;
}

function youtubeVideoId(value) {
  return (
    cleanText(value).match(
      /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([a-zA-Z0-9_-]{6,})/,
    )?.[1] ?? ""
  );
}

function demoEmbedUrl(value) {
  const url = cleanText(value);
  const loomMatch = url.match(/loom\.com\/share\/([a-zA-Z0-9]+)/);
  if (loomMatch) return `https://www.loom.com/embed/${loomMatch[1]}`;

  const driveMatch = url.match(/drive\.google\.com\/file\/d\/([^/]+)/);
  if (driveMatch) return `https://drive.google.com/file/d/${driveMatch[1]}/preview`;

  const youtubeId = youtubeVideoId(url);
  if (youtubeId) return `https://www.youtube.com/embed/${youtubeId}`;

  return "";
}

function loomShareId(value) {
  return cleanText(value).match(/loom\.com\/share\/([a-zA-Z0-9]+)/)?.[1] ?? "";
}

function driveFileId(value) {
  return cleanText(value).match(/drive\.google\.com\/file\/d\/([^/]+)/)?.[1] ?? "";
}

async function demoMetadata(value) {
  const url = cleanText(value);
  const loomId = loomShareId(url);
  if (loomId) {
    try {
      const response = await fetch(
        `https://www.loom.com/v1/oembed?url=${encodeURIComponent(url)}`,
      );
      if (response.ok) {
        const payload = await response.json();
        return {
          demoProvider: "Loom",
          demoThumbnailUrl: cleanText(payload.thumbnail_url),
        };
      }
    } catch {
      return {
        demoProvider: "Loom",
        demoThumbnailUrl: "",
      };
    }

    return {
      demoProvider: "Loom",
      demoThumbnailUrl: "",
    };
  }

  const driveId = driveFileId(url);
  if (driveId) {
    return {
      demoProvider: "Google Drive",
      demoThumbnailUrl: `https://drive.google.com/thumbnail?id=${driveId}&sz=w1200`,
    };
  }

  const youtubeId = youtubeVideoId(url);
  if (youtubeId) {
    return {
      demoProvider: "YouTube",
      demoThumbnailUrl: `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`,
    };
  }

  return {
    demoProvider: "",
    demoThumbnailUrl: "",
  };
}

function normalizeLinkedinUrl(value) {
  const trimmed = value.trim().replace(/[),.\]]+$/g, "");
  if (!trimmed || /no linkedin/i.test(trimmed)) return "";
  const withoutProtocol = trimmed.replace(/^https?:\/\//i, "");
  if (!/^((www\.)?linkedin\.com\/in\/)/i.test(withoutProtocol)) return "";
  const slug = withoutProtocol
    .replace(/^(www\.)?linkedin\.com\/in\//i, "")
    .replace(/\/.*$/, "")
    .toLowerCase();
  if (LINKEDIN_SLUG_BLOCKLIST.has(slug)) return "";
  return `https://${withoutProtocol}`.replace(/\/?$/, "/");
}

const NOISE_NAME = /^(linkedin|email|github|twitter|x)\b[:\s]*$/i;

function parseAttendees(value) {
  const parsed = String(value || "")
    // Emails never belong on the public site; stripping them first also lets
    // "Name email@example.com" lines parse to just the name.
    .replace(/\S+@\S+/g, "")
    .split(/(?=\b\d+[.)]\s)|\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const linkedinMatch = line.match(
        /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/[a-zA-Z0-9-]+\/?/i,
      );
      const linkedin = linkedinMatch ? normalizeLinkedinUrl(linkedinMatch[0]) : "";
      const beforeLinkedin = linkedinMatch ? line.slice(0, linkedinMatch.index) : line;
      const withoutNumber = beforeLinkedin.replace(/^\s*\d+[.)]\s*/, "");
      const withoutBracket = withoutNumber.replace(/^\[|\]$/g, "");
      const name = withoutBracket
        .split(/\s+[-—–]\s+|\s*\|\s*|,\s*/)
        .map((part) => part.trim())
        .find((part) => part && !part.includes("@") && !/^https?:/i.test(part));

      return {
        name: cleanText(name || withoutBracket)
          .replace(/[-—–|,]+$/g, "")
          .trim(),
        linkedin,
      };
    });

  // Lines like "LinkedIn: https://..." or a bare profile URL belong to the
  // attendee named on the previous line.
  const attendees = [];
  for (const entry of parsed) {
    const isNoise = !entry.name || NOISE_NAME.test(entry.name);
    if (isNoise) {
      const previous = attendees[attendees.length - 1];
      if (entry.linkedin && previous && !previous.linkedin) {
        previous.linkedin = entry.linkedin;
      }
      continue;
    }
    attendees.push(entry);
  }

  return attendees.filter(
    (attendee) => attendee.name && !attendee.name.includes("@"),
  );
}

const raw = await readFile(csvPath, "utf8");
const rows = parseCsv(raw.replace(/^﻿/, "")).filter((row) =>
  row.some((cell) => cell.trim()),
);
const headers = rows[0].map((header) => header.trim());
const records = rows.slice(1).map((row) =>
  Object.fromEntries(headers.map((header, index) => [header, row[index] || ""])),
);

const submissions = (
  await Promise.all(
    records.map(async (row, index) => {
      const rawName = cleanText(row["Submission Name"]);
      const override = submissionOverrides.get(rawName);
      const name = override?.name ?? rawName;
      const demoVideo = normalizeDemoVideo(override?.demoVideo ?? row["Demo Video"]);
      const metadata = await demoMetadata(demoVideo);
      const tracks = splitList(row.Tracks || "").map(normalizeTrack);

      return {
        id: slugify(name || `submission-${index + 1}`),
        name: name || `Submission ${index + 1}`,
        description: cleanDescription(row["Submission Description"]),
        demoVideo,
        demoEmbedUrl: demoEmbedUrl(demoVideo),
        ...metadata,
        tracks: Array.from(new Set(tracks)).filter(Boolean),
        attendees: override?.attendees ?? parseAttendees(row["List Team Members"]),
        githubRepo: cleanText(row["Github Repo"]),
        showcaseWorthy: cleanText(row["Showcase worthy?"]),
      };
    }),
  )
).filter((submission) => submission.name && submission.description);

// The export can contain duplicate rows for the same project (e.g. Zeta One
// was submitted twice). Keep one entry per slug, preferring the row that has
// a working demo video.
const bySlug = new Map();
for (const submission of submissions) {
  const existing = bySlug.get(submission.id);
  if (!existing) {
    bySlug.set(submission.id, submission);
    continue;
  }
  console.log(`prepare-data: merged duplicate submission "${submission.name}"`);
  if (!existing.demoVideo && submission.demoVideo) {
    bySlug.set(submission.id, submission);
  }
}
const deduped = Array.from(bySlug.values());

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(deduped, null, 2)}\n`);
console.log(`Wrote ${deduped.length} submissions to ${outputPath}`);
