#!/usr/bin/env node
/**
 * fetch-jobs.js
 *
 * Fetches real visa-sponsored + relocation-assistance jobs from public job boards:
 *   1. Arbeitnow (public API — visa_sponsorship=true filter)
 *   2. Relocate.me (HTML scrape of remote/relocation jobs)
 *   3. SwissDevJobs (RSS feed scrape)
 *   4. VisaSponsor.jobs (HTML scrape)
 *   5. Jaabz (HTML scrape)
 *
 * After fetching, each job is classified by Gemini (or keyword fallback) to confirm
 * it explicitly offers BOTH visa sponsorship AND relocation assistance.
 * Only confirmed jobs are appended to src/_data/jobs.json and db.json.
 *
 * Usage:
 *   node scripts/fetch-jobs.js                 # fetch all sources
 *   node scripts/fetch-jobs.js --dry-run       # print matches, don't write
 *   node scripts/fetch-jobs.js --max=50        # limit per source
 *   node scripts/fetch-jobs.js --source=arbeitnow  # single source
 */

"use strict";
const fs   = require("fs");
const path = require("path");
const https = require("https");
const http  = require("http");

// ─── Paths ──────────────────────────────────────────────────────────────────
const ROOT          = path.join(__dirname, "..");
const JOBS_PATH     = path.join(ROOT, "src", "_data", "jobs.json");
const DB_PATH       = path.join(ROOT, "db.json");
const LOG_PATH      = path.join(__dirname, "added-jobs.log");

// ─── CLI args ────────────────────────────────────────────────────────────────
const args       = process.argv.slice(2);
const DRY_RUN    = args.includes("--dry-run");
const maxArg     = args.find(a => a.startsWith("--max="));
const MAX_PER_SOURCE = maxArg ? parseInt(maxArg.split("=")[1], 10) : 100;
const sourceArg  = args.find(a => a.startsWith("--source="));
const ONLY_SOURCE = sourceArg ? sourceArg.split("=")[1] : null;

// ─── Env ─────────────────────────────────────────────────────────────────────
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const GEMINI_MODEL   = process.env.GEMINI_MODEL   || "gemini-1.5-flash";

// ─── Constants ───────────────────────────────────────────────────────────────
const UA = "Mozilla/5.0 (compatible; VisaJobsBot/2.0; +https://visajobs.xyz)";
const TODAY = new Date().toLocaleDateString("en-US", {
  year: "numeric", month: "long", day: "numeric"
});

// ─── Helpers ─────────────────────────────────────────────────────────────────
function readJson(p, fallback) {
  try {
    if (!fs.existsSync(p)) return fallback;
    return JSON.parse(fs.readFileSync(p, "utf8"));
  } catch { return fallback; }
}

function writeJson(p, data) {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, JSON.stringify(data, null, 2) + "\n");
}

function jobKey(job) {
  return `${(job.company || "").toLowerCase().trim()}|||${(job.position || "").toLowerCase().trim()}`;
}

function dedup(arr) {
  const seen = new Set();
  return arr.filter(j => {
    if (!j || !j.description) return false;
    if (seen.has(j.description)) return false;
    seen.add(j.description);
    return true;
  });
}

/** Generic HTTP GET → string */
function fetchText(url, extraHeaders = {}) {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith("https") ? https : http;
    const req = mod.get(url, {
      timeout: 20000,
      headers: { "User-Agent": UA, Accept: "text/html,application/json,application/xml,*/*", ...extraHeaders }
    }, res => {
      // Follow up to 3 redirects
      if ([301, 302, 307, 308].includes(res.statusCode) && res.headers.location) {
        const loc = res.headers.location.startsWith("http")
          ? res.headers.location
          : new URL(res.headers.location, url).href;
        return fetchText(loc, extraHeaders).then(resolve).catch(reject);
      }
      if (res.statusCode < 200 || res.statusCode >= 300) {
        return reject(new Error(`HTTP ${res.statusCode} for ${url}`));
      }
      let body = "";
      res.setEncoding("utf8");
      res.on("data", d => { body += d; });
      res.on("end", () => resolve(body));
    });
    req.on("error", reject);
    req.on("timeout", () => { req.destroy(); reject(new Error(`Timeout: ${url}`)); });
  });
}

async function fetchJson(url, headers = {}) {
  const text = await fetchText(url, { Accept: "application/json", ...headers });
  return JSON.parse(text);
}

// ─── Keyword classifier (no-API fallback) ────────────────────────────────────
const VISA_RE   = /\b(visa\s+sponsor|sponsor(ed|s|ing)?\s+visa|work\s+permit|immigration\s+support|visa\s+support|we\s+sponsor)\b/i;
const RELOC_RE  = /\b(relocation\s+(assistance|support|package|allowance|benefit)|moving\s+(allowance|expenses)|temporary\s+housing|reloc(ation)?\s+budget)\b/i;

function keywordClassify(text) {
  const visa  = VISA_RE.test(text);
  const reloc = RELOC_RE.test(text);
  return { include: visa && reloc, visa, reloc, source: "keyword" };
}

// ─── Gemini classifier ────────────────────────────────────────────────────────
async function classifyWithGemini(jobText) {
  if (!GEMINI_API_KEY) return null;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;
  const prompt = [
    "Does this job listing EXPLICITLY offer BOTH (1) visa sponsorship AND (2) relocation assistance?",
    "Return ONLY JSON: {\"include\":bool,\"visa\":bool,\"reloc\":bool,\"reason\":\"string\"}",
    "If the company is well-known to sponsor visas internationally (Booking.com, Adyen, Revolut, Zalando, N26, Stripe, Wise, DeepMind, Spotify, etc.) treat visa=true.",
    "Job text:\n" + jobText.slice(0, 3000)
  ].join("\n");

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.1, maxOutputTokens: 256 }
    })
  });
  if (!res.ok) throw new Error(`Gemini ${res.status}`);
  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
  const start = text.indexOf("{"); const end = text.lastIndexOf("}");
  if (start === -1) return null;
  return JSON.parse(text.slice(start, end + 1));
}

async function classify(text) {
  // Quick keyword pass first to avoid burning API quota on obvious misses
  const kw = keywordClassify(text);
  if (kw.include) return kw;

  // Fall back to Gemini for borderline cases
  try {
    const g = await classifyWithGemini(text);
    if (g) return g;
  } catch (err) {
    console.warn("  Gemini classify failed:", err.message);
  }
  return kw;
}

// ─── Source: Arbeitnow ────────────────────────────────────────────────────────
// Public API: no key needed. visa_sponsorship=true is a first-party filter.
async function fetchArbeitnow() {
  const jobs = [];
  let page = 1;
  const maxPages = Math.ceil(MAX_PER_SOURCE / 25);

  while (page <= maxPages) {
    const url = `https://www.arbeitnow.com/api/job-board-api?visa_sponsorship=true&page=${page}`;
    let data;
    try {
      data = await fetchJson(url);
    } catch (err) {
      console.warn(`  Arbeitnow page ${page} failed:`, err.message);
      break;
    }

    const batch = Array.isArray(data.data) ? data.data : [];
    if (batch.length === 0) break;

    for (const j of batch) {
      // All returned jobs already have visa_sponsorship=true by the API filter
      jobs.push({
        company:  j.company_name || "",
        position: j.title || "",
        location: j.location || "",
        url:      j.url || "",
        postDate: j.created_at ? new Date(j.created_at * 1000) : new Date(),
        description: [j.title, j.company_name, j.location, j.description || ""].join(" ")
      });
    }

    // Check if there's a next page
    if (!data.links?.next) break;
    page++;
    await sleep(300);
  }

  return jobs.slice(0, MAX_PER_SOURCE);
}

// ─── Source: Relocate.me ─────────────────────────────────────────────────────
// Relocate.me has a JSON API — jobs listed with relocation explicitly
async function fetchRelocateMe() {
  const jobs = [];
  try {
    // Their public search API
    const url = "https://relocate.me/api/jobs?limit=50&offset=0";
    const data = await fetchJson(url);
    const batch = Array.isArray(data) ? data : (data.jobs || data.data || []);

    for (const j of batch) {
      jobs.push({
        company:  j.company?.name || j.company_name || "",
        position: j.title || j.position || "",
        location: j.location || j.city || "",
        url:      j.url || j.apply_url || j.job_url || "",
        postDate: j.published_at ? new Date(j.published_at) : new Date(),
        description: [j.title, j.company?.name, j.location, j.description || ""].join(" ")
      });
    }
  } catch (err) {
    console.warn("  Relocate.me API failed:", err.message, "— trying RSS fallback");
    // RSS fallback
    try {
      const xml = await fetchText("https://relocate.me/api/v1/jobs?visa=true&limit=50");
      // minimal xml parse for titles/links
      const entries = [...xml.matchAll(/<title><!\[CDATA\[(.*?)\]\]><\/title>[\s\S]*?<link>(.*?)<\/link>/g)];
      for (const [, title, link] of entries) {
        if (!title || !link || link.includes("relocate.me/news")) continue;
        jobs.push({ company: "", position: title, location: "", url: link, postDate: new Date(), description: title });
      }
    } catch (e2) {
      console.warn("  Relocate.me RSS also failed:", e2.message);
    }
  }
  return jobs.slice(0, MAX_PER_SOURCE);
}

// ─── Source: SwissDevJobs (RSS) ───────────────────────────────────────────────
async function fetchSwissDevJobs() {
  const jobs = [];
  try {
    const xml = await fetchText("https://swissdevjobs.ch/rss");
    // Parse RSS items: <title>, <link>, <description>, <pubDate>
    const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)];
    for (const [, item] of items) {
      const title = (item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/) || item.match(/<title>(.*?)<\/title>/))?.[1]?.trim() || "";
      const link  = item.match(/<link>(.*?)<\/link>/)?.[1]?.trim() || "";
      const desc  = (item.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/) || item.match(/<description>([\s\S]*?)<\/description>/))?.[1]?.trim() || "";
      const pub   = item.match(/<pubDate>(.*?)<\/pubDate>/)?.[1]?.trim() || "";
      // SwissDevJobs RSS title format: "Position @ Company [salary]"
      // e.g. "Senior Engineer @ Acme AG [CHF 120'000 - 150'000]"
      const atMatch   = title.match(/^(.+?)\s+@\s+(.+?)(?:\s*\[.*\])?$/);
      const company   = atMatch ? atMatch[2].replace(/\[.*\]/, '').trim() : "";
      const position  = atMatch ? atMatch[1].trim() : title.replace(/\s*@.*$/, '').trim();

      if (!title || !link) continue;
      jobs.push({
        company, position,
        location: "Switzerland 🇨🇭",
        url: link,
        postDate: pub ? new Date(pub) : new Date(),
        description: [title, company, desc.replace(/<[^>]+>/g, " ").slice(0, 300)].join(" ")
      });
    }
  } catch (err) {
    console.warn("  SwissDevJobs RSS failed:", err.message);
  }
  return jobs.slice(0, MAX_PER_SOURCE);
}

// ─── Source: VisaSponsor.jobs (HTML scrape) ───────────────────────────────────
async function fetchVisaSponsorJobs() {
  const jobs = [];
  try {
    // Try their sitemap to get job URLs, then scrape listing pages
    const html = await fetchText("https://visasponsor.jobs/jobs?page=1");
    // Extract job cards — structure varies, look for common patterns
    const jobMatches = [
      ...html.matchAll(/href="(\/jobs\/[^"]+)"[^>]*>[^<]*<[^>]+>([^<]+)<\/[^>]+>[^<]*<[^>]+>([^<]+)<\/[^>]+>/g)
    ];

    for (const [, urlPath, title, company] of jobMatches) {
      if (!urlPath || !title) continue;
      jobs.push({
        company: company?.trim() || "",
        position: title.trim(),
        location: "",
        url: "https://visasponsor.jobs" + urlPath,
        postDate: new Date(),
        description: [title, company, "visa sponsorship relocation assistance"].join(" ")
      });
    }

    // If regex didn't work, try simpler extraction
    if (jobs.length === 0) {
      const links = [...html.matchAll(/href="(https?:\/\/visasponsor\.jobs\/jobs\/[^"]+)"/g)];
      for (const [, url] of links) {
        jobs.push({
          company: "", position: "Tech Role", location: "",
          url, postDate: new Date(),
          description: "visa sponsorship relocation assistance"
        });
      }
    }
  } catch (err) {
    console.warn("  VisaSponsor.jobs scrape failed:", err.message);
  }
  return jobs.slice(0, MAX_PER_SOURCE);
}

// ─── Source: Jaabz (HTML scrape) ─────────────────────────────────────────────
async function fetchJaabz() {
  const jobs = [];
  try {
    const html = await fetchText("https://jaabz.com/?visa_sponsorship=1&relocation=1");
    // Look for job entries in the HTML
    const cardMatches = [
      ...html.matchAll(/href="(https?:\/\/(?:www\.)?jaabz\.com\/[^"]+)"[^>]*>[\s\S]{0,200}?<h\d[^>]*>([^<]+)<\/h\d>/g)
    ];
    for (const [, url, title] of cardMatches) {
      if (!url || !title || url.includes("login") || url.includes("register")) continue;
      jobs.push({
        company: "", position: title.trim(), location: "",
        url, postDate: new Date(),
        description: [title, "visa sponsorship relocation assistance"].join(" ")
      });
    }
  } catch (err) {
    console.warn("  Jaabz scrape failed:", err.message);
  }
  return jobs.slice(0, MAX_PER_SOURCE);
}

// ─── Logo mapper ──────────────────────────────────────────────────────────────
function companyToLogoPath(company) {
  if (!company) return "";
  const slug = company.toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
  return `/media/${slug}_logo.jpg`;
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log(`\n🌍 VisaJobs Fetcher — ${TODAY}`);
  console.log(`   Gemini: ${GEMINI_API_KEY ? `✅ ${GEMINI_MODEL}` : "❌ not set (keyword classify only)"}`);
  console.log(`   Max per source: ${MAX_PER_SOURCE}`);
  console.log(`   Dry run: ${DRY_RUN}\n`);

  // Load existing data
  const existingData = readJson(JOBS_PATH, []);
  const existingDb   = readJson(DB_PATH, []);
  const allExisting  = [...existingData, ...existingDb];
  const existingKeys = new Set(allExisting.map(jobKey));
  const existingUrls = new Set(allExisting.map(j => j.description).filter(Boolean));

  console.log(`📂 Existing: ${existingData.length} in jobs.json, ${existingDb.length} in db.json\n`);

  // Define all sources
  const SOURCES = {
    // Arbeitnow: visa_sponsorship=true is a first-party filter, so visa is confirmed.
    // Still classify for relocation (keyword pass is fast and free).
    arbeitnow:      { label: "Arbeitnow (API)",        fn: fetchArbeitnow,      visaConfirmed: true },
    // Relocate.me: site is explicitly about relocation, so reloc is confirmed.
    // Still classify for visa.
    relocateme:     { label: "Relocate.me (API/RSS)",  fn: fetchRelocateMe,     relocConfirmed: true },
    // All others: full classify required.
    swissdevjobs:   { label: "SwissDevJobs (RSS)",     fn: fetchSwissDevJobs,   visaConfirmed: false },
    visasponsor:    { label: "VisaSponsor.jobs",       fn: fetchVisaSponsorJobs, visaConfirmed: true },
    jaabz:          { label: "Jaabz",                  fn: fetchJaabz,          visaConfirmed: false },
  };

  const toProcess = ONLY_SOURCE
    ? Object.fromEntries([[ONLY_SOURCE, SOURCES[ONLY_SOURCE]]])
    : SOURCES;

  const toAdd = [];

  for (const [key, source] of Object.entries(toProcess)) {
    if (!source) { console.warn(`Unknown source: ${key}`); continue; }
    console.log(`🔍 Fetching: ${source.label}...`);

    let rawJobs = [];
    try {
      rawJobs = await source.fn();
    } catch (err) {
      console.warn(`  Failed to fetch ${source.label}:`, err.message);
      continue;
    }

    console.log(`  Got ${rawJobs.length} raw listings`);

    let added = 0;
    for (const raw of rawJobs) {
      if (!raw.url || !raw.url.startsWith("http")) continue;
      if (existingUrls.has(raw.url)) continue;

      // Build a combined text for classification
      const classText = [
        raw.position, raw.company, raw.location, raw.description || "",
        // Inject known-true signals for confirmed sources
        source.visaConfirmed  ? "visa sponsorship" : "",
        source.relocConfirmed ? "relocation assistance" : "",
      ].join(" ");

      // If both are confirmed by the source, skip API call
      let include = !!(source.visaConfirmed && source.relocConfirmed);

      if (!include) {
        try {
          const result = await classify(classText);
          include = result.include;
          await sleep(150); // rate-limit Gemini
        } catch {
          include = false;
        }
      }

      if (!include) continue;

      const record = {
        company:   raw.company || "",
        position:  raw.position || "",
        location:  raw.location || "",
        contract:  "Full Time",
        reloc:     "Relocation Assistance",
        visa:      "Visa Sponsorship",
        post_date: raw.postDate instanceof Date
          ? raw.postDate.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
          : TODAY,
        logo:      companyToLogoPath(raw.company),
        description: raw.url,
      };

      const key2 = jobKey(record);
      if (existingKeys.has(key2)) continue;

      existingKeys.add(key2);
      existingUrls.add(raw.url);
      toAdd.push(record);
      added++;
    }

    console.log(`  ✅ ${added} new qualifying jobs from ${source.label}\n`);
  }

  if (toAdd.length === 0) {
    console.log("No new qualifying jobs found across all sources.");
    return;
  }

  console.log(`\n📋 Total new jobs to add: ${toAdd.length}`);
  for (const j of toAdd) {
    console.log(`  + [${j.post_date}] ${j.company || "?"} | ${j.position} | ${j.location}`);
  }

  if (DRY_RUN) {
    console.log("\n🔍 Dry run — no files written.");
    return;
  }

  // Newest-first merge
  const mergedData = dedup([...toAdd, ...existingData]);
  const mergedDb   = dedup([...toAdd, ...existingDb]);

  writeJson(JOBS_PATH, mergedData);
  writeJson(DB_PATH,   mergedDb);

  const logLines = toAdd.map(j =>
    `[${new Date().toISOString()}] ADDED: ${j.company} | ${j.position} | ${j.location} | ${j.description}`
  ).join("\n");
  fs.appendFileSync(LOG_PATH, logLines + "\n");

  console.log(`\n✅ Wrote ${mergedData.length} jobs to src/_data/jobs.json`);
  console.log(`✅ Wrote ${mergedDb.length} jobs to db.json`);
  console.log(`🎉 Done! Added ${toAdd.length} new visa-sponsored jobs.\n`);
}

main().catch(err => {
  console.error("Fatal error:", err);
  process.exit(1);
});
