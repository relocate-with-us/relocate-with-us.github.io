const fs = require("fs");
const path = require("path");

const JOBS_DATA_PATH = path.join(__dirname, "..", "src", "_data", "jobs.json");
const ROOT_DB_PATH = path.join(__dirname, "..", "db.json");

function readJson(filePath) {
  if (!fs.existsSync(filePath)) return [];
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + "\n");
}

function sanitizeText(str) {
  if (!str) return "";
  return String(str)
    .replace(/[\n\r\t]+/g, " ") // Replace newlines, carriage returns, tabs with space
    .replace(/\s+/g, " ")       // Collapse multiple spaces into one
    .replace(/\|/g, "-")        // Replace pipe characters with a dash to not break markdown tables
    .trim();
}

function sanitizeJobs(jobs) {
  return jobs.map(job => {
    return {
      ...job,
      company: sanitizeText(job.company),
      position: sanitizeText(job.position),
      location: sanitizeText(job.location),
      contract: sanitizeText(job.contract),
      reloc: sanitizeText(job.reloc),
      visa: sanitizeText(job.visa),
      post_date: sanitizeText(job.post_date),
      logo: sanitizeText(job.logo),
      description: sanitizeText(job.description)
    };
  });
}

function main() {
  console.log("Sanitizing jobs database files...");

  const existingJobs = readJson(JOBS_DATA_PATH);
  console.log(`Loaded ${existingJobs.length} jobs from ${JOBS_DATA_PATH}`);
  const sanitizedJobs = sanitizeJobs(existingJobs);
  writeJson(JOBS_DATA_PATH, sanitizedJobs);
  console.log(`Saved sanitized jobs to ${JOBS_DATA_PATH}`);

  const existingDb = readJson(ROOT_DB_PATH);
  console.log(`Loaded ${existingDb.length} jobs from ${ROOT_DB_PATH}`);
  const sanitizedDb = sanitizeJobs(existingDb);
  writeJson(ROOT_DB_PATH, sanitizedDb);
  console.log(`Saved sanitized jobs to ${ROOT_DB_PATH}`);

  console.log("Database sanitization complete!");
}

main();
