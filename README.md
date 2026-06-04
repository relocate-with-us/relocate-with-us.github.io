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