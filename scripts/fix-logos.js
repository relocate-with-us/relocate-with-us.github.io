const fs = require('fs');
const path = require('path');

const jobsPath = path.join(__dirname, '..', 'src', '_data', 'jobs.json');
const dbPath = path.join(__dirname, '..', 'db.json');

const jobs = JSON.parse(fs.readFileSync(jobsPath, 'utf8'));

let updated = 0;
for (const job of jobs) {
  if (!job.logo || job.logo === '/favicon/android-chrome-192x192.png') {
    const encodedName = encodeURIComponent(job.company);
    job.logo = `https://ui-avatars.com/api/?name=${encodedName}&background=random&color=fff&font-size=0.4&rounded=true&size=128`;
    updated++;
  }
}

if (updated > 0) {
  fs.writeFileSync(jobsPath, JSON.stringify(jobs, null, 2) + '\n');
  if (fs.existsSync(dbPath)) {
    fs.writeFileSync(dbPath, JSON.stringify(jobs, null, 2) + '\n');
  }
  console.log(`Updated ${updated} logos in jobs.json`);
} else {
  console.log('No logos needed updating');
}
