# How to Add Recruiter Contacts to premium-sponsors.json

This is the most valuable thing you can add to the Pro page. Real recruiter names + LinkedIn URLs
turn a company database into a warm introduction list.

---

## The recruiter field format

Each company in `src/_data/premium-sponsors.json` has a `recruiters` array:

```json
"recruiters": [
  {
    "name": "Jane Smith",
    "title": "Senior Technical Recruiter",
    "linkedin": "https://www.linkedin.com/in/janesmith",
    "focus": "Backend / Infrastructure",
    "note": ""
  }
]
```

Fields:
- `name` — Full name from their LinkedIn profile
- `title` — Their job title (copy exactly from LinkedIn)
- `linkedin` — Full LinkedIn profile URL
- `focus` — What they hire for (e.g. "Backend", "ML / AI", "Frontend")
- `note` — Optional tip for how to approach them (leave empty if none)

---

## How to find recruiters for each company

### Step 1 — LinkedIn search (free method)

Search for:
```
"Technical Recruiter" "Zalando" Berlin
```
or
```
"Talent Acquisition" "Adyen"
```

Filter by:
- Current company = [company name]
- Location = [city]

Aim to find 1–3 recruiters per company. Prioritize:
1. Those who post job listings on LinkedIn (they're most active)
2. Those with "Technical Recruiter" or "Talent Acquisition Partner" in their title
3. Those who've been at the company 1+ years (more likely still active)

### Step 2 — Company careers page

Many companies list their recruiters on Greenhouse, Lever, or Workable job listings.
Open any current job posting for that company and look for the "contact" field or the
recruiter name on the job card.

### Step 3 — LinkedIn Sales Navigator (paid, $80/mo)

If you're doing this at scale, LinkedIn Sales Navigator lets you filter:
- Company = Zalando
- Title = Recruiter OR Talent Acquisition
- Seniority = Senior / Manager

Much faster than the free method.

### Step 4 — Check X/Twitter

Many tech recruiters are active on X. Search:
```
from:recruiter "Zalando" OR "Adyen" OR "Booking"
```
or find their LinkedIn first, then look for their X handle in their profile.

---

## How many recruiters to add per company

- **Minimum**: 1 per company (the most active/current one)
- **Target**: 2–3 per company covering different engineering domains
- **Large companies** (Amazon, Google, SAP): 1–2 per major location

---

## Keeping it up to date

Recruiters change companies frequently (~18 month median tenure).
- Update the JSON file quarterly
- Add a `verified` field with the date you confirmed the contact is still there

---

## Adding a new company entirely

Copy this template:

```json
{
  "name": "Company Name",
  "slug": "company-name",
  "logo": "/media/company_name_logo.png",
  "hq": "City, Country",
  "country": "Germany",
  "city": "Berlin",
  "industry": "Sector",
  "size": "1,000+",
  "visa": "EU Blue Card",
  "salaryRange": {
    "mid": "€70–90k",
    "senior": "€90–125k",
    "staff": "€120–155k"
  },
  "relocationPackage": "Description of what they cover",
  "careers": "https://careers.example.com/",
  "applicationTip": "Write a 3–5 sentence tip specific to this company. What does their culture reward? What signals in your application will stand out? What do interviewers care about? Reference their public values, blog posts, or known interview process.",
  "interviewProcess": "1–2 sentence overview. E.g. Recruiter screen → take-home → 2 tech rounds → values. ~3 weeks.",
  "techStack": ["Go", "Python", "Kubernetes", "PostgreSQL"],
  "recruiters": [
    {
      "name": "Recruiter Full Name",
      "title": "Technical Recruiter",
      "linkedin": "https://www.linkedin.com/in/profileslug",
      "focus": "Engineering",
      "note": ""
    }
  ]
}
```

---

## Countries to prioritize adding more companies

Current coverage:

| Country | Companies |
|---------|-----------|
| Germany | 9 |
| United Kingdom | 7 |
| Netherlands | 5 |
| France | 2 |
| Sweden | 2 |
| Estonia | 2 |
| Spain | 1 |
| United States | 2 |
| Ireland | 1 |
| Switzerland | 1 |
| Australia | 1 |

**Priority to expand:** Canada (Toronto tech scene, large immigrant population), Portugal (NHR tax regime, growing startup scene), Ireland (US company EU HQs).

## Companies to add (suggestions)

### Germany
- Celonis (process mining, Munich, EU Blue Card)
- Enpal (green energy, Berlin)
- Gorillas / Flink (quick commerce)
- Siemens Healthineers (medtech, EU Blue Card)
- Infineon (semiconductors, Munich)
- Scout24 (marketplace, Berlin, EU Blue Card)

### Netherlands
- ASML (semiconductors, Eindhoven, Highly Skilled Migrant)
- Philips (medtech, Eindhoven)
- ING Tech (banking, Amsterdam)
- TomTom (navigation tech, Amsterdam)

### UK
- Deliveroo (food delivery, London)
- OakNorth Bank (fintech, London)
- Babylon Health (health tech)
- Arm Holdings (semiconductors, Cambridge)

### Ireland
- HubSpot (Dublin, CSEP, large EU hub)
- Workday (Dublin, CSEP)
- Zendesk (Dublin)

### Switzerland
- UBS (banking tech, Zurich)
- Credit Suisse / CS (now UBS)
- Roche / Novartis (pharma tech, Basel)
- ETH spin-offs (various)

### Canada
- Shopify (Ottawa / remote, Global Talent Stream)
- Wattpad (Toronto)
- Cohere AI (Toronto, hot AI startup)
- Faire (San Francisco + Toronto offices)
