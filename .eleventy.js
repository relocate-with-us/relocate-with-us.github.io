const { EleventyRenderPlugin } = require("@11ty/eleventy");

module.exports = function (eleventyConfig) {
  eleventyConfig.addPlugin(EleventyRenderPlugin);

  // Passthrough copies (paths relative to project root)
  eleventyConfig.addPassthroughCopy({ "media": "media" });
  eleventyConfig.addPassthroughCopy({ "favicon": "favicon" });
  eleventyConfig.addPassthroughCopy({ "favicon/favicon.ico": "favicon.ico" });
  eleventyConfig.addPassthroughCopy({ "CNAME": "CNAME" });
  eleventyConfig.addPassthroughCopy({ "src/assets/js": "assets/js" });
  eleventyConfig.addPassthroughCopy({ "pro-downloads": "pro/downloads" });

  // Date filters
  eleventyConfig.addFilter("dateDisplay", (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  });

  eleventyConfig.addFilter("isoDate", (dateStr) => {
    const d = new Date(dateStr);
    // W3C Sitemap protocol requires YYYY-MM-DD or YYYY-MM-DDThh:mm:ss+00:00
    // Using YYYY-MM-DD for maximum compatibility with sitemap validators
    return d.toISOString().split('T')[0];
  });

  eleventyConfig.addFilter("timeAgo", (dateStr) => {
    if (!dateStr) return "Recently";
    // ISO dates (YYYY-MM-DD) are UTC midnight — anchor to noon to avoid
    // off-by-one-day errors in timezones ahead of UTC (e.g. UTC+2).
    const normalized = /^\d{4}-\d{2}-\d{2}$/.test(dateStr)
      ? dateStr + "T12:00:00"
      : dateStr;
    const date = new Date(normalized);
    if (isNaN(date.getTime())) return "Recently";
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);
    const intervals = [
      { label: "year",   seconds: 31536000 },
      { label: "month",  seconds: 2592000 },
      { label: "week",   seconds: 604800 },
      { label: "day",    seconds: 86400 },
      { label: "hour",   seconds: 3600 },
      { label: "minute", seconds: 60 },
    ];
    for (const interval of intervals) {
      const count = Math.floor(seconds / interval.seconds);
      if (count >= 1)
        return `${count} ${interval.label}${count > 1 ? "s" : ""} ago`;
    }
    return "Just now";
  });

  // Slug filter for job URLs
  eleventyConfig.addFilter("jobSlug", (job) => {
    const base = `${job.company}-${job.position}-${job.location || ""}`
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .substring(0, 80);
    
    // Hash of the description URL to guarantee uniqueness
    let hash = 0;
    const desc = job.description || "";
    for (let i = 0; i < desc.length; i++) {
      hash = (hash << 5) - hash + desc.charCodeAt(i);
      hash |= 0;
    }
    const hashStr = Math.abs(hash).toString(36).substring(0, 4);
    
    return `${base}-${hashStr}`;
  });

  // Extract city from location string (before the comma)
  eleventyConfig.addFilter("extractCity", (location) => {
    if (!location) return "";
    const parts = location.split(",");
    return parts[0].trim();
  });

  // Map country name to ISO 3166-1 alpha-2 code
  eleventyConfig.addFilter("countryCode", (location) => {
    if (!location) return "";
    const cleaned = location.replace(
      /[\u{1F1E0}-\u{1F1FF}\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu,
      ""
    );
    const parts = cleaned.split(",");
    const country = parts[parts.length - 1].trim();
    const codes = {
      "Germany": "DE", "Netherlands": "NL", "United Kingdom": "GB", "UK": "GB",
      "Spain": "ES", "Ireland": "IE", "Sweden": "SE", "Switzerland": "CH",
      "Portugal": "PT", "Poland": "PL", "Denmark": "DK", "Czech Republic": "CZ",
      "France": "FR", "Austria": "AT", "Belgium": "BE", "Finland": "FI",
      "Italy": "IT", "Norway": "NO", "Bulgaria": "BG", "Romania": "RO",
      "Europe": "EU", "Canada": "CA", "Australia": "AU", "Japan": "JP",
      "New Zealand": "NZ", "UAE": "AE", "Singapore": "SG", "Qatar": "QA",
    };
    return codes[country] || "EU";
  });

  // Generate validThrough date (90 days after post_date) in ISO format
  eleventyConfig.addFilter("validThrough", (dateStr) => {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return new Date(Date.now() + 90 * 86400000).toISOString().split("T")[0];
    date.setDate(date.getDate() + 90);
    return date.toISOString().split("T")[0];
  });

  // Extract country from location string
  eleventyConfig.addFilter("extractCountry", (location) => {
    if (!location) return "";
    const cleaned = location.replace(
      /[\u{1F1E0}-\u{1F1FF}\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu,
      ""
    );
    const parts = cleaned.split(",");
    return parts[parts.length - 1].trim();
  });

  // Limit/slice filter
  eleventyConfig.addFilter("limit", (arr, limit) => {
    return arr.slice(0, limit);
  });

  // JSON stringify for inline data
  eleventyConfig.addFilter("jsonify", (obj) => {
    return JSON.stringify(obj);
  });

  // Unique countries from jobs
  eleventyConfig.addFilter("uniqueCountries", (jobs) => {
    const countries = new Set();
    jobs.forEach((job) => {
      const cleaned = (job.location || "").replace(
        /[\u{1F1E0}-\u{1F1FF}\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu,
        ""
      );
      const parts = cleaned.split(",");
      const country = parts[parts.length - 1].trim();
      if (country) countries.add(country);
    });
    return Array.from(countries).sort();
  });

  // Group jobs by country
  eleventyConfig.addFilter("groupByCountry", (jobs) => {
    const groups = {};
    jobs.forEach((job) => {
      const cleaned = (job.location || "").replace(
        /[\u{1F1E0}-\u{1F1FF}\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu,
        ""
      );
      const parts = cleaned.split(",");
      const country = parts[parts.length - 1].trim();
      if (!groups[country]) groups[country] = [];
      groups[country].push(job);
    });
    return groups;
  });

  // Count filter
  eleventyConfig.addFilter("length", (arr) => {
    return arr ? arr.length : 0;
  });

  // Format numbers with locale
  eleventyConfig.addFilter("localeString", (num) => {
    if (num === null || num === undefined) return "";
    return Number(num).toLocaleString("en-US");
  });

  // Premium sponsors: get sorted unique country list
  eleventyConfig.addFilter("uniqueField", (arr, field) => {
    if (!arr) return [];
    const seen = new Set();
    return arr
      .map((item) => item[field])
      .filter((v) => v && !seen.has(v) && seen.add(v))
      .sort();
  });

  // Premium sponsors: count items by field value
  eleventyConfig.addFilter("countByField", (arr, field, value) => {
    if (!arr) return 0;
    return arr.filter((item) => item[field] === value).length;
  });

  // Generate a company logo URL from the company name using Google's Favicon API
  // Falls back gracefully — the frontend onerror will catch any misses
  eleventyConfig.addFilter("companyLogo", (job) => {
    if (!job) return "/favicon/android-chrome-192x192.png";
    // If the job already has a local /media/ logo, use it
    if (job.logo && job.logo.startsWith("/media/")) return job.logo;
    // Extract domain from the apply URL if possible
    const applyUrl = job.description || "";
    // For Greenhouse URLs: boards.greenhouse.io/COMPANY → try COMPANY.com
    const ghMatch = applyUrl.match(/greenhouse\.io\/(\w[\w-]+)/);
    // For Lever URLs: jobs.lever.co/COMPANY → try COMPANY.com
    const leverMatch = applyUrl.match(/lever\.co\/(\w[\w-]+)/);
    // For Arbeitnow: arbeitnow.com/jobs/companies/COMPANY
    const arbMatch = applyUrl.match(/arbeitnow\.com\/jobs\/companies\/([^/]+)/);

    let domain = "";
    if (ghMatch) {
      domain = ghMatch[1].replace(/-/g, "") + ".com";
    } else if (leverMatch) {
      domain = leverMatch[1].replace(/-/g, "") + ".com";
    } else if (arbMatch) {
      domain = arbMatch[1].replace(/-/g, "") + ".com";
    } else if (job.company) {
      // Guess domain from company name: "Zalando" → "zalando.com"
      domain = job.company.toLowerCase()
        .replace(/\s*(gmbh|inc\.?|ltd\.?|llc\.?|ag|se|plc|corp\.?|limited|co\.?)\s*$/i, "")
        .replace(/[^a-z0-9]+/g, "")
        .trim() + ".com";
    }
    if (!domain) return "/favicon/android-chrome-192x192.png";
    return `https://t3.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://${domain}&size=128`;
  });

  // Year for copyright
  eleventyConfig.addShortcode("year", () => `${new Date().getFullYear()}`);

  // Job count shortcode
  eleventyConfig.addShortcode("jobCount", function () {
    const jobs = this.ctx?.jobs || [];
    return `${jobs.length}`;
  });

  // Build db.json for backward compatibility
  eleventyConfig.on("eleventy.after", async ({ dir }) => {
    const fs = require("fs");
    const path = require("path");
    const srcPath = path.join(__dirname, "src", "_data", "jobs.json");
    const destPath = path.join(dir.output, "db.json");
    if (fs.existsSync(srcPath)) {
      fs.copyFileSync(srcPath, destPath);
    }
  });

  // Collections
  eleventyConfig.addCollection("blogPosts", (collectionApi) => {
    return collectionApi
      .getFilteredByGlob("src/blog/posts/*.md")
      .sort((a, b) => b.date - a.date);
  });

  eleventyConfig.addCollection("countryGuides", (collectionApi) => {
    return collectionApi
      .getFilteredByGlob("src/resources/country-guides/*.md")
      .sort((a, b) => a.data.title.localeCompare(b.data.title));
  });

  return {
    dir: {
      input: "src",
      output: "_site",
      includes: "_includes",
      data: "_data",
    },
    templateFormats: ["njk", "md", "html"],
    htmlTemplateEngine: "njk",
    markdownTemplateEngine: "njk",
  };
};
