#!/usr/bin/env node

/**
 * Job availability checker.
 *
 * Reads src/_data/jobs.json, makes HEAD requests to each job's apply URL,
 * removes entries that return 404/410 or fail to connect, and writes back
 * the cleaned list. A log of removed jobs is written to scripts/removed-jobs.log.
 *
 * Usage:
 *   node scripts/check-jobs.js              # check all
 *   node scripts/check-jobs.js --dry-run    # report only, don't modify
 *   node scripts/check-jobs.js --batch=50   # check first 50 only (for CI limits)
 */

const fs = require("fs");
const path = require("path");
const https = require("https");
const http = require("http");

const JOBS_PATH = path.join(__dirname, "..", "src", "_data", "jobs.json");
const LOG_PATH = path.join(__dirname, "removed-jobs.log");
const TIMEOUT_MS = 10000;
const CONCURRENCY = 10;
const DEAD_CODES = new Set([404, 410, 403, 451]);

const args = process.argv.slice(2);
const DRY_RUN = args.includes("--dry-run");
const batchArg = args.find((a) => a.startsWith("--batch="));
const BATCH_SIZE = batchArg ? parseInt(batchArg.split("=")[1], 10) : Infinity;

function checkUrl(url) {
  return new Promise((resolve) => {
    const mod = url.startsWith("https") ? https : http;
    const req = mod.request(
      url,
      {
        method: "HEAD",
        timeout: TIMEOUT_MS,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (compatible; VisaJobsBot/1.0; +https://visajobs.xyz)",
          Accept: "text/html,application/xhtml+xml",
        },
      },
      (res) => {
        // Follow one redirect
        if ([301, 302, 307, 308].includes(res.statusCode) && res.headers.location) {
          const loc = res.headers.location;
          const redirectUrl = loc.startsWith("http") ? loc : new URL(loc, url).href;
          const mod2 = redirectUrl.startsWith("https") ? https : http;
          const req2 = mod2.request(
            redirectUrl,
            {
              method: "HEAD",
              timeout: TIMEOUT_MS,
              headers: {
                "User-Agent":
                  "Mozilla/5.0 (compatible; VisaJobsBot/1.0; +https://visajobs.xyz)",
              },
            },
            (res2) => {
              resolve({ status: res2.statusCode, ok: !DEAD_CODES.has(res2.statusCode) });
            }
          );
          req2.on("error", () => resolve({ status: 0, ok: false, error: "redirect-error" }));
          req2.on("timeout", () => { req2.destroy(); resolve({ status: 0, ok: false, error: "redirect-timeout" }); });
          req2.end();
          return;
        }
        resolve({ status: res.statusCode, ok: !DEAD_CODES.has(res.statusCode) });
      }
    );
    req.on("error", (err) => {
      // DNS failures and connection refused mean the domain is dead
      if (["ENOTFOUND", "ECONNREFUSED", "ECONNRESET"].includes(err.code)) {
        resolve({ status: 0, ok: false, error: err.code });
      } else {
        // Other errors (e.g. cert issues): give benefit of doubt
        resolve({ status: 0, ok: true, error: err.code });
      }
    });
    req.on("timeout", () => {
      req.destroy();
      // Timeouts often mean the server is overloaded, not dead
      resolve({ status: 0, ok: true, error: "TIMEOUT" });
    });
    req.end();
  });
}

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
  for (let w = 0; w < Math.min(concurrency, items.length); w++) {
    workers.push(worker());
  }
  await Promise.all(workers);
  return results;
}

async function main() {
  const raw = fs.readFileSync(JOBS_PATH, "utf8");
  const jobs = JSON.parse(raw);

  const toCheck = jobs.slice(0, BATCH_SIZE);
  console.log(
    `Checking ${toCheck.length} of ${jobs.length} jobs (dry-run: ${DRY_RUN})...\n`
  );

  const removed = [];
  let checked = 0;

  const results = await runBatch(
    toCheck,
    async (job, i) => {
      const url = job.description;
      if (!url || !url.startsWith("http")) {
        return { job, result: { status: 0, ok: false, error: "invalid-url" } };
      }
      const result = await checkUrl(url);
      checked++;
      if (checked % 20 === 0) {
        process.stdout.write(`  checked ${checked}/${toCheck.length}\r`);
      }
      return { job, result };
    },
    CONCURRENCY
  );

  console.log(`\nResults:`);

  const deadJobs = new Set();
  for (const { job, result } of results) {
    if (!result.ok) {
      deadJobs.add(job);
      const reason = result.error || `HTTP ${result.status}`;
      removed.push({
        company: job.company,
        position: job.position,
        url: job.description,
        reason,
        date: new Date().toISOString(),
      });
      console.log(`  DEAD: ${job.company} - ${job.position} (${reason})`);
    }
  }

  console.log(`\n${deadJobs.size} dead jobs found out of ${toCheck.length} checked.`);

  if (deadJobs.size === 0) {
    console.log("All jobs are available. Nothing to do.");
    return;
  }

  if (DRY_RUN) {
    console.log("Dry run mode. No changes written.");
    return;
  }

  // Remove dead jobs
  const liveJobs = jobs.filter((j) => !deadJobs.has(j));
  fs.writeFileSync(JOBS_PATH, JSON.stringify(liveJobs, null, 2) + "\n");
  console.log(`Wrote ${liveJobs.length} jobs to ${JOBS_PATH} (removed ${deadJobs.size}).`);

  // Append to log
  const logLines = removed
    .map(
      (r) =>
        `[${r.date}] REMOVED: ${r.company} | ${r.position} | ${r.url} | ${r.reason}`
    )
    .join("\n");
  fs.appendFileSync(LOG_PATH, logLines + "\n");
  console.log(`Logged removals to ${LOG_PATH}`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
