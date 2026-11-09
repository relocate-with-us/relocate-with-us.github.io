# relocate-with-us.github.io

## Automated job ingestion

The job ingestion script pulls from ATS providers and updates:
- src/_data/jobs.json (source of truth)
- db.json (root copy for local usage)

Configure sources in scripts/job-sources.json. Each entry needs a provider and org slug.

Example entry:
{
	"provider": "greenhouse",
	"org": "company-slug",
	"company": "Company Name",
	"logo": "/media/company_logo.jpg"
}

Supported providers: greenhouse, lever.

Local run:
	npm run update:jobs

CI uses secrets if available:
- GEMINI_API_KEY (optional)
- MISTRAL_API_KEY (optional)
- GEMINI_MODEL (optional)
- MISTRAL_MODEL (optional)
## Job quality and discovery

The scheduled `scripts/fetch-jobs.js` importer currently publishes only Arbeitnow API listings with full descriptions and explicit visa sponsorship and relocation language. Other adapters are paused until their listing details can be verified; keyword checks are conservative and still require review. `description` is the application URL; `job_description` holds source text. Older listings without source text link to the original listing.

The availability workflow checks all listings and removes invalid URLs and HTTP 404/410 responses; blocked requests, timeouts and other errors need manual review. Both job data copies are kept in sync. A `/llms.txt` discovery file and existing sitemap help crawlers find pages; neither guarantees indexing or AI citations. Google Analytics is configured via `site.analytics.ga`; Search Console ownership and analytics reporting access must be configured in the Google accounts.
