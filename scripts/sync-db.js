#!/usr/bin/env node

/**
 * sync-db.js
 *
 * One-way sync: merges src/_data/jobs.json (canonical) into db.json (legacy mirror).
 * Run this whenever you manually edit jobs.json or db.json to bring them back in sync.
 * Also fixes any jobs missing post_date or with stale "Not specified" dates.
 *
 * Usage:
 *   node scripts/sync-db.js           # sync and fix
 *   node scripts/sync-db.js --dry-run # report differences, don't write
 */

"use strict";
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const JOBS_DATA_PATH = path.join(ROOT, "src", "_data", "jobs.json");
const ROOT_DB_PATH = path.join(ROOT, "db.json");

const args = process.argv.slice(2);
const DRY_RUN = args.includes("--dry-run");

function readJson(p, fallback) {
  try {
    if (!fs.existsSync(p)) return fallback;
    return JSON.parse(fs.readFileSync(p, "utf8"));
  } catch (e) {
    console.error("Read error:", p, e.message);
    return fallback;
  }
}

function writeJson(p, data) {
  fs.writeFileSync(p, JSON.stringify(data, null, 2) + "\n");
}

function fixJob(job) {
  // Remove duplicate post_date keys (malformed JSON artifact)
  const fixed = { ...job };

  // Fix missing or placeholder dates
  if (!fixed.post_date || fixed.post_date === "Not specified" || fixed.post_date === "") {
    fixed.post_date = "January 1, 2025"; // safe default for old unlabeled jobs
  }

  // Ensure required badge fields exist
  if (!fixed.reloc) fixed.reloc = "Relocation Assistance";
  if (!fixed.visa) fixed.visa = "Visa Sponsorship";
  if (!fixed.contract) fixed.contract = "Full Time";

  return fixed;
}

async function main() {
  const jobsData = readJson(JOBS_DATA_PATH, []);
  const dbData = readJson(ROOT_DB_PATH, []);

  console.log(`src/_data/jobs.json: ${jobsData.length} entries`);
  console.log(`db.json:             ${dbData.length} entries`);

  // Build canonical merged set (jobs.json wins on conflict, db.json fills gaps)
  const byUrl = new Map();

  // First load db.json as base
  for (const job of dbData) {
    if (job && job.description) byUrl.set(job.description, fixJob(job));
  }

  // Then overlay jobs.json (takes priority)
  for (const job of jobsData) {
    if (job && job.description) byUrl.set(job.description, fixJob(job));
  }

  // Sort by post_date descending (newest first)
  const all = [...byUrl.values()];
  all.sort((a, b) => {
    const da = new Date(a.post_date);
    const db_ = new Date(b.post_date);
    if (isNaN(da.getTime()) && isNaN(db_.getTime())) return 0;
    if (isNaN(da.getTime())) return 1;
    if (isNaN(db_.getTime())) return -1;
    return db_ - da;
  });

  console.log(`\nMerged total: ${all.length} unique jobs`);

  // Show top 5 by date
  console.log("\nTop 5 most recent:");
  for (const j of all.slice(0, 5)) {
    console.log(`  ${j.post_date} | ${j.company} — ${j.position}`);
  }

  if (DRY_RUN) {
    console.log("\nDry run — no files written.");
    return;
  }

  writeJson(JOBS_DATA_PATH, all);
  writeJson(ROOT_DB_PATH, all);

  console.log(`\n✅ Synced both files with ${all.length} jobs (sorted newest-first).`);
}

main().catch((e) => {
  console.error("Fatal:", e);
  process.exit(1);
});
