#!/usr/bin/env node

/*
 * Automated job ingestion.
 *
 * Pulls jobs from configured sources (currently Greenhouse and Lever),
 * classifies for visa sponsorship + relocation assistance, merges into
 * src/_data/jobs.json, and mirrors to root db.json.
 */

const fs = require("fs");
const path = require("path");

const JOBS_PATH = path.join(__dirname, "..", "src", "_data", "jobs.json");
const ROOT_DB_PATH = path.join(__dirname, "..", "db.json");
const SOURCES_PATH = path.join(__dirname, "job-sources.json");
const ADD_LOG_PATH = path.join(__dirname, "added-jobs.log");
const COMPANIES_PATH = path.join(__dirname, "..", "src", "_data", "companies.json");
const SPONSORS_PATH = path.join(
  __dirname,
  "..",
  "src",
  "_data",
  "premium-sponsors.json"
);

const args = process.argv.slice(2);
const DRY_RUN = args.includes("--dry-run");
const maxPerSourceArg = args.find((a) => a.startsWith("--max-per-source="));
const MAX_PER_SOURCE = maxPerSourceArg
  ? parseInt(maxPerSourceArg.split("=")[1], 10)
  : parseInt(process.env.MAX_JOBS_PER_SOURCE || "200", 10);

const CONCURRENCY = parseInt(process.env.UPDATE_JOBS_CONCURRENCY || "5", 10);

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-1.5-flash";
const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY || "";
const MISTRAL_MODEL = process.env.MISTRAL_MODEL || "mistral-small-latest";

const USER_AGENT =
  "Mozilla/5.0 (compatible; VisaJobsBot/1.0; +https://visajobs.xyz)";

function readJson(filePath, fallback) {
  try {
    if (!fs.existsSync(filePath)) return fallback;
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (err) {
    console.error(`Failed to read ${filePath}:`, err.message);
    return fallback;
  }
}

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + "\n");
}

function normalizeText(input) {
  if (!input) return "";
  return String(input).replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function formatPostDate(date) {
  try {
    const d = new Date(date);
    if (Number.isNaN(d.getTime())) return null;
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return null;
  }
}

function sanitizeText(str) {
  if (!str) return "";
  return String(str)
    .replace(/[\n\r\t]+/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\|/g, "-")
    .trim();
}

function toJobRecord({
  company,
  position,
  location,
  contract,
  postDate,
  logo,
  url,
}) {
  if (!company || !position || !url) return null;
  return {
    company: sanitizeText(company),
    position: sanitizeText(position),
    location: sanitizeText(location),
    contract: sanitizeText(contract || "Full Time"),
    reloc: "Relocation Assistance",
    visa: "Visa Sponsorship",
    post_date: sanitizeText(postDate),
    logo: sanitizeText(logo),
    description: sanitizeText(url),
  };
}

function getCompanyLogo(company, sponsors) {
  if (!company) return "";
  const match = sponsors.get(company.toLowerCase());
  return match ? match.logo : "/favicon/android-chrome-192x192.png";
}

function buildSponsorsMap() {
  const sponsors = readJson(SPONSORS_PATH, []);
  const map = new Map();
  for (const item of sponsors) {
    if (item && item.name && item.logo) {
      map.set(item.name.toLowerCase(), item);
    }
  }
  return map;
}

async function fetchJson(url) {
  const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }
  return res.json();
}

async function getGreenhouseJobs(source) {
  const url = `https://boards-api.greenhouse.io/v1/boards/${source.org}/jobs?content=true`;
  const data = await fetchJson(url);
  const jobs = Array.isArray(data.jobs) ? data.jobs : [];
  return jobs.map((job) => ({
    company: source.company || source.org,
    position: job.title,
    location: job.location?.name || "",
    url: job.absolute_url,
    updatedAt: job.updated_at,
    description: job.content || "",
  }));
}

async function getLeverJobs(source) {
  const url = `https://api.lever.co/v0/postings/${source.org}?mode=json`;
  const data = await fetchJson(url);
  const jobs = Array.isArray(data) ? data : [];
  return jobs.map((job) => ({
    company: source.company || source.org,
    position: job.text,
    location: job.categories?.location || "",
    url: job.hostedUrl,
    updatedAt: job.createdAt ? new Date(job.createdAt) : null,
    description: job.description || "",
  }));
}

async function mapWithConcurrency(items, limit, fn) {
  const results = new Array(items.length);
  let idx = 0;

  async function worker() {
    while (idx < items.length) {
      const i = idx++;
      results[i] = await fn(items[i], i);
    }
  }

  const workers = [];
  for (let w = 0; w < Math.min(limit, items.length); w++) {
    workers.push(worker());
  }
  await Promise.all(workers);
  return results;
}

function keywordClassify(text) {
  const visaRegex = /(visa sponsorship|sponsor(ed|ship)? visa|work permit|immigration support|visa support)/i;
  const relocRegex = /(relocation (assistance|support|package|benefit)|moving (allowance|expenses)|relocation allowance|temporary housing)/i;
  const visa = visaRegex.test(text);
  const relocation = relocRegex.test(text);
  return {
    include: visa && relocation,
    visa,
    relocation,
    confidence: visa && relocation ? 0.7 : 0.2,
    reason: "keyword",
  };
}

function buildClassifierPrompt(jobText) {
  return [
    "Classify whether this job explicitly offers BOTH visa sponsorship AND relocation assistance.",
    "Return ONLY a JSON object with keys: include (boolean), visa (boolean), relocation (boolean), confidence (number 0-1), reason (string).",
    "If unclear, set include=false and confidence < 0.6.",
    "Job text:",
    jobText,
  ].join("\n");
}

async function classifyWithGemini(jobText) {
  if (!GEMINI_API_KEY) return null;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;
  const body = {
    contents: [{ role: "user", parts: [{ text: buildClassifierPrompt(jobText) }] }],
    generationConfig: { temperature: 0.1 },
  };
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`Gemini HTTP ${res.status}`);
  }
  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
  return parseClassifierResponse(text);
}

async function classifyWithMistral(jobText) {
  if (!MISTRAL_API_KEY) return null;
  const res = await fetch("https://api.mistral.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${MISTRAL_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MISTRAL_MODEL,
      messages: [
        {
          role: "system",
          content:
            "You classify job listings. Output ONLY JSON with include, visa, relocation, confidence, reason.",
        },
        { role: "user", content: buildClassifierPrompt(jobText) },
      ],
      temperature: 0.1,
    }),
  });
  if (!res.ok) {
    throw new Error(`Mistral HTTP ${res.status}`);
  }
  const data = await res.json();
  const text = data.choices?.[0]?.message?.content || "";
  return parseClassifierResponse(text);
}

function parseClassifierResponse(text) {
  try {
    const jsonStart = text.indexOf("{");
    const jsonEnd = text.lastIndexOf("}");
    if (jsonStart === -1 || jsonEnd === -1) return null;
    const parsed = JSON.parse(text.slice(jsonStart, jsonEnd + 1));
    if (typeof parsed.include !== "boolean") return null;
    return parsed;
  } catch {
    return null;
  }
}

async function classifyJob(jobText) {
  try {
    const gemini = await classifyWithGemini(jobText);
    if (gemini) return gemini;
  } catch (err) {
    console.warn("Gemini classify failed:", err.message);
  }

  try {
    const mistral = await classifyWithMistral(jobText);
    if (mistral) return mistral;
  } catch (err) {
    console.warn("Mistral classify failed:", err.message);
  }

  return keywordClassify(jobText);
}

async function loadSourceJobs(source) {
  if (!source || !source.provider || !source.org) {
    throw new Error("Invalid source entry. Each source needs provider and org.");
  }
  if (source.provider === "greenhouse") {
    return getGreenhouseJobs(source);
  }
  if (source.provider === "lever") {
    return getLeverJobs(source);
  }
  throw new Error(`Unsupported provider: ${source.provider}`);
}

async function main() {
  const sources = readJson(SOURCES_PATH, []);
  if (!Array.isArray(sources) || sources.length === 0) {
    console.log("No job sources configured. Update scripts/job-sources.json.");
    return;
  }

  const sponsorsMap = buildSponsorsMap();
  const existing = readJson(JOBS_PATH, []);
  const existingByUrl = new Map(
    existing.map((job) => [job.description, job])
  );

  const added = [];

  for (const source of sources) {
    console.log(`Fetching jobs from ${source.provider}:${source.org}...`);
    let jobs = [];
    try {
      jobs = await loadSourceJobs(source);
    } catch (err) {
      console.warn(`  Failed to fetch ${source.org}:`, err.message);
      continue;
    }

    if (MAX_PER_SOURCE && jobs.length > MAX_PER_SOURCE) {
      jobs = jobs.slice(0, MAX_PER_SOURCE);
    }

    const classified = await mapWithConcurrency(
      jobs,
      CONCURRENCY,
      async (job) => {
        const text = normalizeText(
          [job.position, job.location, job.description].join("\n")
        );
        const result = await classifyJob(text);
        return { job, result };
      }
    );

    for (const { job, result } of classified) {
      if (!result || !result.include || !result.visa || !result.relocation) continue;
      if (!job.url || existingByUrl.has(job.url)) continue;

      const postDate =
        formatPostDate(job.updatedAt) ||
        formatPostDate(new Date()) ||
        formatPostDate(Date.now());
      const logo = source.logo || getCompanyLogo(source.company || job.company, sponsorsMap);

      const record = toJobRecord({
        company: source.company || job.company,
        position: job.position,
        location: job.location,
        contract: source.contract || "Full Time",
        postDate,
        logo,
        url: job.url,
      });

      if (!record) continue;
      added.push(record);
      existingByUrl.set(job.url, record);
    }
  }

  if (added.length === 0) {
    console.log("No new matching jobs found.");
    return;
  }

  const merged = [...added, ...existing];
  const seen = new Set();
  const deduped = [];
  for (const job of merged) {
    if (!job || !job.description || seen.has(job.description)) continue;
    seen.add(job.description);
    deduped.push(job);
  }

  if (DRY_RUN) {
    console.log(`Dry run: ${added.length} new jobs would be added.`);
    return;
  }

  writeJson(JOBS_PATH, deduped);
  writeJson(ROOT_DB_PATH, deduped);

  const logLines = added
    .map(
      (job) =>
        `[${new Date().toISOString()}] ADDED: ${job.company} | ${job.position} | ${job.description}`
    )
    .join("\n");
  fs.appendFileSync(ADD_LOG_PATH, logLines + "\n");

  console.log(`Added ${added.length} new jobs.`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
