#!/usr/bin/env node

/**
 * check-jobs.js — Robust job availability checker.
 *
 * Removes jobs that are dead or suspicious in two passes:
 *
 * Pass 1 — STATIC RULES (instant, no network):
 *   - URL is missing or not http(s)
 *   - URL points to just a careers homepage (no specific job path)
 *   - URL matches known AI-hallucinated patterns (e.g. /jobs/FAKE-slug)
 *
 * Pass 2 — LIVE URL CHECK (network, with timeout):
 *   - Returns 404, 410, 451
 *   - DNS not found (ENOTFOUND)
 *   - Connection refused
 *
 * Usage:
 *   node scripts/check-jobs.js              # check all
 *   node scripts/check-jobs.js --dry-run    # report without writing
 *   node scripts/check-jobs.js --batch=100  # check first N only
 */

"use strict";
const fs   = require("fs");
const path = require("path");
const https = require("https");
const http  = require("http");

const JOBS_PATH = path.join(__dirname, "..", "src", "_data", "jobs.json");
const LOG_PATH  = path.join(__dirname, "removed-jobs.log");
const TIMEOUT_MS  = 10000;
const CONCURRENCY = 8;

// HTTP status codes that definitively mean the job is gone
const DEAD_STATUS = new Set([404, 410, 451]);

const args = process.argv.slice(2);
const DRY_RUN    = args.includes("--dry-run");
const batchArg   = args.find(a => a.startsWith("--batch="));
const BATCH_SIZE = batchArg ? parseInt(batchArg.split("=")[1], 10) : Infinity;

// ─── Pass 1: Static rules ────────────────────────────────────────────────────

/**
 * Generic careers homepages — not specific job listings.
 * A real job URL always has a path segment beyond just /careers or /jobs.
 */
const GENERIC_HOMEPAGE_RE = new RegExp([
  "^https?://[^/]+/careers/?$",
  "^https?://[^/]+/jobs/?$",
  "^https?://[^/]+/en(-[a-z]{2})?/careers/?$",
  "^https?://[^/]+/en(-[a-z]{2})?/jobs/?$",
  "^https?://[^/]+/about/careers/?$",
  "^https?://careers\\.[^/]+\\.[a-z]+/?$",      // https://careers.company.com/
  "^https?://jobs\\.[^/]+\\.[a-z]+/?$",           // https://jobs.company.com/
].join("|"), "i");

/**
 * Patterns characteristic of AI-hallucinated job URLs.
 * These paths look plausible but are invented.
 */
const AI_HALLUCINATION_RE = /\/jobs\/[a-z]+(?:-[a-z]+){2,}(?:-engineer|-manager|-developer|-analyst|-lead|-architect|-designer|-portal|-scientist|-data|-product|-owner)(?:\/?$)/i;

const FAKE_DOMAINS_RE = /\.careers\/jobs\//i;

/**
 * Known trustworthy job board domains — URLs from these are always real.
 * We still HTTP-check them, but they bypass the hallucination pattern check.
 */
const TRUSTED_SOURCES = new Set([
  "arbeitnow.com",
  "relocate.me",
  "swissdevjobs.ch",
  "visasponsor.jobs",
  "jaabz.com",
  "greenhouse.io",
  "lever.co",
  "ashbyhq.com",
  "workday.com",
  "jobs.lever.co",
  "boards.greenhouse.io",
  "apply.workable.com",
  "smartrecruiters.com",
  "linkedin.com",
  "indeed.com",
]);

function getDomain(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

function staticCheck(job) {
  const url = job.description || "";

  if (!url || !url.startsWith("http")) {
    return { ok: false, reason: "missing-url" };
  }

  const domain = getDomain(url);

  // Always trust known job board sources
  const isTrusted = [...TRUSTED_SOURCES].some(d => domain === d || domain.endsWith("." + d));
  if (isTrusted) return { ok: true };

  // Reject bare careers homepages
  if (GENERIC_HOMEPAGE_RE.test(url)) {
    return { ok: false, reason: "generic-careers-homepage" };
  }

  // Reject known fake domain patterns like .careers/jobs/
  if (FAKE_DOMAINS_RE.test(url)) {
    return { ok: false, reason: "ai-hallucinated-url" };
  }

  // Reject AI-hallucinated slug patterns (only on non-trusted domains)
  if (AI_HALLUCINATION_RE.test(url)) {
    return { ok: false, reason: "ai-hallucinated-url" };
  }

  return { ok: true };
}

// ─── Pass 2: Live HTTP check ─────────────────────────────────────────────────

function checkUrl(url) {
  return new Promise((resolve) => {
    const mod = url.startsWith("https") ? https : http;
    const req = mod.request(url, {
      method: "HEAD",
      timeout: TIMEOUT_MS,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; VisaJobsBot/2.0; +https://visajobs.xyz)",
        "Accept": "text/html,application/xhtml+xml",
      },
    }, (res) => {
      // Follow one redirect
      if ([301, 302, 307, 308].includes(res.statusCode) && res.headers.location) {
        const loc = res.headers.location;
        const redirectUrl = loc.startsWith("http") ? loc : new URL(loc, url).href;
        const mod2 = redirectUrl.startsWith("https") ? https : http;
        const req2 = mod2.request(redirectUrl, {
          method: "HEAD",
          timeout: TIMEOUT_MS,
          headers: { "User-Agent": "Mozilla/5.0 (compatible; VisaJobsBot/2.0; +https://visajobs.xyz)" },
        }, (res2) => {
          const dead = DEAD_STATUS.has(res2.statusCode);
          resolve({ status: res2.statusCode, ok: !dead });
        });
        req2.on("error", () => resolve({ status: 0, ok: false, reason: "redirect-error" }));
        req2.on("timeout", () => { req2.destroy(); resolve({ status: 0, ok: true, reason: "redirect-timeout" }); });
        req2.end();
        return;
      }
      const dead = DEAD_STATUS.has(res.statusCode);
      resolve({ status: res.statusCode, ok: !dead });
    });

    req.on("error", (err) => {
      if (["ENOTFOUND", "ECONNREFUSED", "ECONNRESET"].includes(err.code)) {
        resolve({ status: 0, ok: false, reason: err.code });
      } else {
        // e.g. cert errors — give benefit of the doubt
        resolve({ status: 0, ok: true, reason: err.code });
      }
    });
    req.on("timeout", () => {
      req.destroy();
      resolve({ status: 0, ok: true, reason: "TIMEOUT" });
    });
    req.end();
  });
}

// ─── Concurrency runner ───────────────────────────────────────────────────────

async function runBatch(items, fn, concurrency) {
  const results = new Array(items.length);
  let idx = 0;
  async function worker() {
    while (idx < items.length) {
      const i = idx++;
      results[i] = await fn(items[i], i);
    }
  }
  const workers = [];
  for (let w = 0; w < Math.min(concurrency, items.length); w++) workers.push(worker());
  await Promise.all(workers);
  return results;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const raw  = fs.readFileSync(JOBS_PATH, "utf8");
  const jobs = JSON.parse(raw);
  const toCheck = jobs.slice(0, BATCH_SIZE);

  console.log(`\n🔍 Checking ${toCheck.length} of ${jobs.length} jobs (dry-run: ${DRY_RUN})\n`);

  const removed = [];
  const deadJobs = new Set();

  // ── Pass 1: Static checks (instant) ──────────────────────────────────────
  console.log("Pass 1: Static rules (no network)...");
  let staticRemoved = 0;
  const needsNetworkCheck = [];

  for (const job of toCheck) {
    const { ok, reason } = staticCheck(job);
    if (!ok) {
      deadJobs.add(job);
      removed.push({ company: job.company, position: job.position, url: job.description, reason, date: new Date().toISOString() });
      console.log(`  ✂️  REMOVED (${reason}): ${job.company} — ${job.position}`);
      staticRemoved++;
    } else {
      needsNetworkCheck.push(job);
    }
  }
  console.log(`  → ${staticRemoved} removed by static rules. ${needsNetworkCheck.length} jobs need network check.\n`);

  // ── Pass 2: Live HTTP checks ──────────────────────────────────────────────
  console.log("Pass 2: Live HTTP checks...");
  let checked = 0;

  const results = await runBatch(needsNetworkCheck, async (job) => {
    const result = await checkUrl(job.description);
    checked++;
    if (checked % 20 === 0) process.stdout.write(`  checked ${checked}/${needsNetworkCheck.length}\r`);
    return { job, result };
  }, CONCURRENCY);

  console.log(`\n  HTTP check results:`);
  let networkRemoved = 0;
  for (const { job, result } of results) {
    if (!result.ok) {
      deadJobs.add(job);
      const reason = result.reason || `HTTP ${result.status}`;
      removed.push({ company: job.company, position: job.position, url: job.description, reason, date: new Date().toISOString() });
      console.log(`  ❌ DEAD (${reason}): ${job.company} — ${job.position}`);
      networkRemoved++;
    }
  }
  console.log(`  → ${networkRemoved} removed by HTTP checks.\n`);

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log(`\n📊 Summary: ${deadJobs.size} total removed out of ${toCheck.length} checked.`);
  console.log(`   Static: ${staticRemoved} | Network: ${networkRemoved}`);

  if (deadJobs.size === 0) {
    console.log("✅ All jobs look good. Nothing to remove.");
    return;
  }

  if (DRY_RUN) {
    console.log("\n🔍 Dry run — no files written.");
    return;
  }

  // Write cleaned list
  const liveJobs = jobs.filter(j => !deadJobs.has(j));
  fs.writeFileSync(JOBS_PATH, JSON.stringify(liveJobs, null, 2) + "\n");
  console.log(`\n✅ Wrote ${liveJobs.length} live jobs (removed ${deadJobs.size}).`);

  // Append to log
  const logLines = removed.map(r =>
    `[${r.date}] REMOVED: ${r.company} | ${r.position} | ${r.url} | ${r.reason}`
  ).join("\n");
  fs.appendFileSync(LOG_PATH, logLines + "\n");
  console.log(`📝 Logged removals to ${LOG_PATH}`);
}

main().catch(err => {
  console.error("Fatal:", err);
  process.exit(1);
});
