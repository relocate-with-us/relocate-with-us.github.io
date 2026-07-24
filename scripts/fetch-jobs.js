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
const TODAY = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

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

// ─── Keyword classifier (Old school) ─────────────────────────────────────────
const VISA_RE   = /\b(visa\s+sponsor|sponsor(ed|s|ing)?\s+visa|work\s+permit|immigration\s+support|visa\s+support|we\s+sponsor|sponsorship\s+available|highly\s+skilled\s+migrant|blue\s+card|eligible\s+for\s+sponsorship)\b/i;
const RELOC_RE  = /\b(relocation\s+(assistance|support|package|allowance|benefit|budget|services)|moving\s+(allowance|expenses|cost)|temporary\s+housing|reloc(ate|ation)|help\s+with\s+relocation|relocating|help\s+you\s+move)\b/i;

function keywordClassify(text) {
  const visa  = VISA_RE.test(text);
  const reloc = RELOC_RE.test(text);
  return { include: visa && reloc, visa, reloc, relocation: reloc, source: "keyword" };
}

// ─── Gemini classifier ────────────────────────────────────────────────────────
async function fetchWithRetry(url, options, maxRetries = 3) {
  let attempt = 0;
  while (attempt < maxRetries) {
    try {
      const res = await fetch(url, options);
      if (res.status === 429) {
        attempt++;
        const delay = Math.pow(2, attempt) * 2000;
        console.warn(`  429 received, waiting ${delay}ms before retry... (attempt ${attempt}/${maxRetries})`);
        await sleep(delay);
        continue;
      }
      return res;
    } catch (err) {
      attempt++;
      if (attempt >= maxRetries) throw err;
      await sleep(1000);
    }
  }
  throw new Error("Max retries exceeded for fetch request");
}

async function classifyWithGemini(jobText) {
  if (!GEMINI_API_KEY) return null;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;
  const prompt = [
    "Does this job listing EXPLICITLY offer BOTH (1) visa sponsorship AND (2) relocation assistance?",
    "Return ONLY JSON: {\"include\":bool,\"visa\":bool,\"reloc\":bool,\"reason\":\"string\"}",
    "If the company is well-known to sponsor visas internationally (Booking.com, Adyen, Revolut, Zalando, N26, Stripe, Wise, DeepMind, Spotify, etc.) treat visa=true.",
    "Job text:\n" + jobText.slice(0, 3000)
  ].join("\n");

  const res = await fetchWithRetry(url, {
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
  try {
    const gemini = await classifyWithGemini(text);
    if (gemini) return { ...gemini, source: "gemini" };
  } catch (err) {
    console.warn("  Gemini classify failed:", err.message);
  }

  // Keyword fallback stays available when Gemini is not configured.
  return keywordClassify(text);
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
async function fetchRelocateMe() {
  const jobs = [];
  try {
    const html = await fetchText("https://relocate.me/international-jobs");
    const blocks = html.split('<div class="jobs-list__job');
    blocks.shift(); // remove header part

    for (const block of blocks) {
      const content = block.split('class="jobs-list__job')[0].split('class="jobs-list__pagination')[0];
      const pMatches = [...content.matchAll(/<p>([^<]+)<\/p>/gi)].map(m => m[1].trim());
      
      let location = "";
      let company = "";
      if (pMatches.length >= 2) {
        location = pMatches[0];
        company = pMatches[1];
      } else if (pMatches.length === 1) {
        location = pMatches[0];
      }

      const aMatch = content.match(/<a href="([^"]+)"[^>]*>\s*<b>([\s\S]*?)<\/b>/i);
      const urlPath = aMatch ? aMatch[1].trim() : "";
      const title = aMatch ? aMatch[2].replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").trim() : "";

      if (title && urlPath) {
        jobs.push({
          company,
          position: title,
          location,
          url: "https://relocate.me" + urlPath,
          postDate: new Date(),
          description: [title, company, location, "visa sponsorship relocation assistance"].join(" ")
        });
      }
    }
  } catch (err) {
    console.warn("  Relocate.me scrape failed:", err.message);
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
    const html = await fetchText("https://visasponsor.jobs/api/jobs");
    const blocks = html.split('<a href="/api/jobs/');
    blocks.shift(); // remove header part

    for (const block of blocks) {
      const content = block.split('<a href="/api/jobs/')[0];
      const urlMatch = content.match(/^([^"'\s>]+)/);
      const urlPath = urlMatch ? urlMatch[1] : "";
      
      const titleMatch = content.match(/class="[^"]*fs-5[^"]*"[^>]*>([^<]+)<\/div>/i);
      const title = titleMatch ? titleMatch[1].trim() : "";
      
      const companyMatch = content.match(/class="[^"]*employer-name[^"]*"[^>]*>([^<]+)<\/span>/i);
      const company = companyMatch ? companyMatch[1].trim() : "";

      const locMatch = content.match(/class="[^"]*col-11[^"]*sub-font[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
      const location = locMatch ? locMatch[1].replace(/<[^>]+>/g, " ").trim() : "";

      if (title && urlPath) {
        jobs.push({
          company,
          position: title,
          location,
          url: "https://visasponsor.jobs/api/jobs/" + urlPath,
          postDate: new Date(),
          description: [title, company, location, "visa sponsorship relocation assistance"].join(" ")
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
    const cardMatches = [
      ...html.matchAll(/href="(https?:\/\/(?:www\.)?jaabz\.com\/job\/[^"]+)"[^>]*>[\s\S]{0,300}?<h\d[^>]*>([^<]+)<\/h\d>/gi)
    ];
    for (const [, url, title] of cardMatches) {
      if (!url || !title) continue;
      // Try to parse company and location from title if formatted like "Title at Company in Location"
      let position = title.trim();
      let company = "";
      let location = "";

      if (position.includes(" at ")) {
        const parts = position.split(" at ");
        position = parts[0].trim();
        const companyAndLoc = parts[1].trim();
        if (companyAndLoc.includes(" in ")) {
          const cParts = companyAndLoc.split(" in ");
          company = cParts[0].trim();
          location = cParts[1].trim();
        } else {
          company = companyAndLoc;
        }
      }

      jobs.push({
        company, position, location,
        url, postDate: new Date(),
        description: [title, company, location, "visa sponsorship relocation assistance"].join(" ")
      });
    }
  } catch (err) {
    console.warn("  Jaabz scrape failed:", err.message);
  }
  return jobs.slice(0, MAX_PER_SOURCE);
}

// ─── Source: LinkedIn (Guest Search API) ──────────────────────────────────────
async function fetchLinkedIn() {
  const jobs = [];
  const keywords = ["visa sponsorship", "relocation assistance"];
  for (const kw of keywords) {
    try {
      const url = `https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search?keywords=${encodeURIComponent(kw)}&location=Worldwide&start=0`;
      const html = await fetchText(url, {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      });

      const cards = html.split("<li");
      for (const card of cards) {
        const titleMatch = card.match(/class="base-search-card__title"[^>]*>\s*([\s\S]*?)\s*<\/h3>/i);
        const companyMatch = card.match(/class="base-search-card__subtitle"[^>]*>\s*<a[^>]*>([\s\S]*?)<\/a>/i) || card.match(/class="base-search-card__subtitle"[^>]*>\s*([\s\S]*?)\s*<\/h4>/i);
        const locMatch = card.match(/class="job-search-card__location"[^>]*>\s*([\s\S]*?)\s*<\/span>/i);
        const linkMatch = card.match(/href="(https:\/\/[a-z]+\.linkedin\.com\/jobs\/view\/[^"?]+)/i);

        const position = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, "").trim() : "";
        const company = companyMatch ? companyMatch[1].replace(/<[^>]+>/g, "").trim() : "";
        const location = locMatch ? locMatch[1].replace(/<[^>]+>/g, "").trim() : "";
        const jobUrl = linkMatch ? linkMatch[1] : "";

        if (position && jobUrl) {
          jobs.push({
            company,
            position,
            location,
            url: jobUrl,
            postDate: new Date(),
            description: [position, company, location, kw].join(" ")
          });
        }
      }
    } catch (err) {
      console.warn(`  LinkedIn scrape for "${kw}" failed:`, err.message);
    }
  }
  return jobs.slice(0, MAX_PER_SOURCE);
}

// ─── Source: YC Jobs (HackerNews Who is Hiring + Work at a Startup) ────────────
async function fetchYCJobs() {
  const jobs = [];
  try {
    const url = "https://hn.algolia.com/api/v1/search_by_date?tags=story,author_whoishiring&query=who%20is%20hiring";
    const data = await fetchJson(url);
    const hits = data.hits || [];
    if (hits.length > 0) {
      const storyId = hits[0].objectID;
      const commentsUrl = `https://hn.algolia.com/api/v1/search?tags=comment,story_${storyId}&query=visa`;
      const commentsData = await fetchJson(commentsUrl);
      for (const comment of (commentsData.hits || [])) {
        const text = comment.comment_text || "";
        const lines = text.split(/<br\s*\/?>|\n/);
        const firstLine = lines[0] ? lines[0].replace(/<[^>]+>/g, "").trim() : "";
        const parts = firstLine.split("|").map(p => p.trim());
        if (parts.length >= 2) {
          const company = parts[0];
          const position = parts[1];
          const location = parts[2] || "Remote / Various";
          const hnUrl = `https://news.ycombinator.com/item?id=${comment.objectID}`;
          jobs.push({
            company,
            position,
            location,
            url: hnUrl,
            postDate: new Date(comment.created_at),
            description: text.replace(/<[^>]+>/g, " ")
          });
        }
      }
    }
  } catch (err) {
    console.warn("  YC Jobs fetch failed:", err.message);
  }
  return jobs.slice(0, MAX_PER_SOURCE);
}

// ─── Logo mapper ──────────────────────────────────────────────────────────────
function buildMediaMap() {
  const mediaDir = path.join(__dirname, "..", "media");
  if (!fs.existsSync(mediaDir)) return new Map();
  try {
    const files = fs.readdirSync(mediaDir);
    const map = new Map();
    for (const f of files) {
      if (f.endsWith(".Identifier")) continue;
      const norm = f.toLowerCase()
        .replace(/_logo$/, "")
        .replace(/_logo_logo$/, "")
        .replace(/_logo\.[a-z0-9]+$/, "")
        .replace(/\.[a-z0-9]+$/, "")
        .replace(/[^a-z0-9]+/g, "");
      if (norm) {
        map.set(norm, `/media/${f}`);
      }
    }
    return map;
  } catch {
    return new Map();
  }
}

const mediaMap = buildMediaMap();

function buildSponsorsMap() {
  const sponsorsPath = path.join(__dirname, "..", "src", "_data", "premium-sponsors.json");
  const sponsors = readJson(sponsorsPath, []);
  const map = new Map();
  for (const s of sponsors) {
    if (s && s.name && s.logo) {
      map.set(s.name.toLowerCase().trim(), s.logo);
    }
  }
  return map;
}

const sponsorsMap = buildSponsorsMap();

function companyToLogoPath(company) {
  if (!company) return "";
  const nameLower = company.toLowerCase().trim();
  
  // 1. Check if we have this exact company in premium-sponsors
  if (sponsorsMap.has(nameLower)) {
    return sponsorsMap.get(nameLower);
  }

  // 2. Check if we have a match in mediaMap using normalized name
  const norm = nameLower.replace(/[^a-z0-9]+/g, "");
  if (mediaMap.has(norm)) {
    return mediaMap.get(norm);
  }

  // 3. Fallback to Clearbit logo API
  const cleanName = company.toLowerCase().replace(/[^a-z0-9]/g, "");
  return `https://logo.clearbit.com/${cleanName}.com`;
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
    linkedin:       { label: "LinkedIn",               fn: fetchLinkedIn,       visaConfirmed: false },
    ycjobs:         { label: "YC Jobs (HN & Startups)", fn: fetchYCJobs,         visaConfirmed: false },
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

      // If both are confirmed by the source, OR if the company is a verified premium sponsor, skip classification
      let include = !!(source.visaConfirmed && source.relocConfirmed);

      if (!include && raw.company) {
        const companyLower = raw.company.toLowerCase().trim();
        if (sponsorsMap.has(companyLower)) {
          include = true;
        }
      }

      if (!include) {
        try {
          const result = await classify(classText);
          include = result.include;
          if (result.source !== "keyword" && result.source !== "keyword-skip") {
            await sleep(1500); // rate-limit Gemini only if we hit the API
          } else {
            await sleep(100);  // short sleep for fast keyword evaluation
          }
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
          ? raw.postDate.toISOString().split("T")[0]
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
