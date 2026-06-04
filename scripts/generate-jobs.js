#!/usr/bin/env node

/**
 * generate-jobs.js
 *
 * Uses Gemini AI to generate a fresh batch of visa-sponsored + relocation
 * job listings dated today. Jobs are prepended to both:
 *   - src/_data/jobs.json  (used by 11ty build)
 *   - db.json              (legacy mirror, kept in sync)
 *
 * The script is idempotent: it deduplicates by (company + position) key,
 * so re-running it won't create duplicates.
 *
 * Usage:
 *   node scripts/generate-jobs.js              # generate ~20 jobs
 *   node scripts/generate-jobs.js --count=30   # generate ~30 jobs
 *   node scripts/generate-jobs.js --dry-run    # print jobs, don't write
 */

"use strict";
const fs = require("fs");
const path = require("path");

// ─── Paths ─────────────────────────────────────────────────────────────────
const ROOT = path.join(__dirname, "..");
const JOBS_DATA_PATH = path.join(ROOT, "src", "_data", "jobs.json");
const ROOT_DB_PATH = path.join(ROOT, "db.json");
const LOG_PATH = path.join(__dirname, "added-jobs.log");

// ─── CLI args ───────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const DRY_RUN = args.includes("--dry-run");
const countArg = args.find((a) => a.startsWith("--count="));
const TARGET_COUNT = countArg ? parseInt(countArg.split("=")[1], 10) : 20;

// ─── Env ────────────────────────────────────────────────────────────────────
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-1.5-flash";

if (!GEMINI_API_KEY) {
  console.error("ERROR: GEMINI_API_KEY environment variable is not set.");
  process.exit(1);
}

// ─── Helpers ────────────────────────────────────────────────────────────────
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
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + "\n");
}

function formatDate(d) {
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function jobKey(job) {
  return `${(job.company || "").toLowerCase().trim()}|||${(job.position || "").toLowerCase().trim()}`;
}

// ─── Gemini call ────────────────────────────────────────────────────────────
async function callGemini(prompt) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;
  const body = {
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 8192,
    },
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini API error ${res.status}: ${errText.slice(0, 300)}`);
  }

  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
  return text;
}

// ─── Prompt builder ─────────────────────────────────────────────────────────
function buildPrompt(todayStr, existingKeys, count) {
  const existingList =
    existingKeys.size > 0
      ? `\nALREADY IN DATABASE (do NOT repeat these company+position combos):\n${[...existingKeys]
          .slice(0, 80)
          .map((k) => "- " + k.replace("|||", " | "))
          .join("\n")}\n`
      : "";

  return `You are a job board data assistant for visajobs.xyz, which lists tech jobs with BOTH visa sponsorship AND relocation assistance in Europe and other destinations.

Generate exactly ${count} realistic job listings dated ${todayStr}. These must be:
1. Real companies known to sponsor visas for international hires (e.g. Booking.com, Adyen, Revolut, Zalando, N26, Spotify, Stripe, Wise, DeepMind, Klarna, Typeform, Personio, SumUp, Miro, Wolt, Bolt, Monzo, Cloudflare, Datadog, SAP, Siemens, ASML, Ericsson, TomTom, Ubisoft, Criteo, Doctolib, Delivery Hero, Auto1 Group, etc.)
2. Realistic job titles for 2026 (software engineers, data engineers, ML engineers, DevOps, mobile engineers, platform engineers, etc.)
3. Located in real European tech hubs (Amsterdam, Berlin, Munich, London, Dublin, Stockholm, Barcelona, Madrid, Paris, Lisbon, Tallinn, Helsinki, Zurich, Vienna, Copenhagen, etc.)
4. Mix of seniority: Senior, Staff, and some Mid-level roles
5. Diverse roles: backend, frontend, mobile (iOS/Android), data, ML/AI, DevOps/platform, QA
${existingList}
Return ONLY a valid JSON array. No markdown fences, no explanations, no extra text. Each element must have exactly these fields:
{
  "company": "string",
  "position": "string",
  "location": "City, Country flag_emoji",
  "contract": "Full Time",
  "reloc": "Relocation Assistance",
  "visa": "Visa Sponsorship",
  "post_date": "${todayStr}",
  "logo": "/media/COMPANY_slug_logo.jpg",
  "description": "https://careers.COMPANY.com/..."
}

Rules for logo field: use lowercase company name with underscores and _logo.jpg suffix. Example: Booking.com → /media/booking_com_logo.jpg, Delivery Hero → /media/deliveryhero_logo.jpg
Rules for description: use real careers page URLs. If company has a specific ATS (greenhouse, lever, ashby, workday), use that format.

Generate ${count} jobs now:`;
}

// ─── Parse Gemini output ────────────────────────────────────────────────────
function parseJobs(rawText) {
  // Strip possible markdown fences
  let text = rawText.trim();
  text = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "");

  // Find the JSON array
  const start = text.indexOf("[");
  const end = text.lastIndexOf("]");
  if (start === -1 || end === -1) {
    throw new Error("No JSON array found in Gemini response");
  }

  const jsonStr = text.slice(start, end + 1);
  const parsed = JSON.parse(jsonStr);

  if (!Array.isArray(parsed)) {
    throw new Error("Parsed value is not an array");
  }

  // Validate and normalise each entry
  const valid = [];
  for (const job of parsed) {
    if (!job || typeof job !== "object") continue;
    if (!job.company || !job.position || !job.description) continue;

    valid.push({
      company: String(job.company).trim(),
      position: String(job.position).trim(),
      location: String(job.location || "").trim(),
      contract: String(job.contract || "Full Time").trim(),
      reloc: "Relocation Assistance",
      visa: "Visa Sponsorship",
      post_date: String(job.post_date || "").trim(),
      logo: String(job.logo || "").trim(),
      description: String(job.description || "").trim(),
    });
  }

  return valid;
}

// ─── Main ───────────────────────────────────────────────────────────────────
async function main() {
  const today = new Date();
  const todayStr = formatDate(today);

  console.log(`\n🚀 VisaJobs Generator — ${todayStr}`);
  console.log(`   Model: ${GEMINI_MODEL}`);
  console.log(`   Target: ${TARGET_COUNT} new jobs`);
  console.log(`   Dry run: ${DRY_RUN}\n`);

  // Load existing data from BOTH files, prefer jobs.json (canonical)
  const existingJobsData = readJson(JOBS_DATA_PATH, []);
  const existingDbData = readJson(ROOT_DB_PATH, []);

  // Merge both to build the full dedup key set
  const allExisting = [...existingJobsData, ...existingDbData];
  const existingKeys = new Set(allExisting.map(jobKey));
  const existingByKey = new Map(allExisting.map((j) => [jobKey(j), j]));
  const existingByUrl = new Set(allExisting.map((j) => j.description).filter(Boolean));

  console.log(`📂 Existing jobs: ${existingJobsData.length} in jobs.json, ${existingDbData.length} in db.json`);
  console.log(`🔑 Dedup keys: ${existingKeys.size} unique (company+position combos)\n`);

  // Call Gemini
  console.log("🤖 Calling Gemini to generate jobs...");
  const prompt = buildPrompt(todayStr, existingKeys, TARGET_COUNT);

  let rawText;
  try {
    rawText = await callGemini(prompt);
  } catch (err) {
    console.error("Gemini call failed:", err.message);
    process.exit(1);
  }

  console.log(`✅ Gemini responded (${rawText.length} chars)\n`);

  // Parse
  let newJobs;
  try {
    newJobs = parseJobs(rawText);
  } catch (err) {
    console.error("Failed to parse Gemini response:", err.message);
    console.error("Raw response (first 500 chars):", rawText.slice(0, 500));
    process.exit(1);
  }

  console.log(`📋 Parsed ${newJobs.length} jobs from Gemini`);

  // Deduplicate against existing
  const toAdd = [];
  const skipped = [];
  for (const job of newJobs) {
    const key = jobKey(job);
    if (existingKeys.has(key) || existingByUrl.has(job.description)) {
      skipped.push(job);
      continue;
    }
    existingKeys.add(key);
    existingByUrl.add(job.description);
    toAdd.push(job);
  }

  console.log(`➕ New (unique): ${toAdd.length}`);
  console.log(`⏭️  Skipped (duplicate): ${skipped.length}\n`);

  if (toAdd.length === 0) {
    console.log("No new unique jobs to add. Exiting.");
    return;
  }

  // Print preview
  for (const job of toAdd) {
    console.log(`  + ${job.company} | ${job.position} | ${job.location}`);
  }
  console.log();

  if (DRY_RUN) {
    console.log("🔍 Dry run — no files written.");
    return;
  }

  // Merge: new jobs go FIRST (most recent at top)
  const mergedData = [...toAdd, ...existingJobsData];
  const mergedDb = [...toAdd, ...existingDbData];

  // Final dedup pass by URL on merged arrays
  const dedup = (arr) => {
    const seen = new Set();
    return arr.filter((j) => {
      if (!j || !j.description) return false;
      if (seen.has(j.description)) return false;
      seen.add(j.description);
      return true;
    });
  };

  const finalData = dedup(mergedData);
  const finalDb = dedup(mergedDb);

  // Write both files
  writeJson(JOBS_DATA_PATH, finalData);
  writeJson(ROOT_DB_PATH, finalDb);

  // Log
  const logLines = toAdd
    .map(
      (job) =>
        `[${today.toISOString()}] ADDED: ${job.company} | ${job.position} | ${job.location} | ${job.description}`
    )
    .join("\n");
  fs.appendFileSync(LOG_PATH, logLines + "\n");

  console.log(`✅ Wrote ${finalData.length} jobs to src/_data/jobs.json`);
  console.log(`✅ Wrote ${finalDb.length} jobs to db.json`);
  console.log(`📝 Logged ${toAdd.length} additions to ${LOG_PATH}`);
  console.log(`\n🎉 Done! Added ${toAdd.length} fresh visa-sponsored jobs.\n`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
