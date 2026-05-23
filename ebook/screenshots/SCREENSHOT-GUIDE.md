# Screenshot guide

This file lists every screenshot needed, in order, with:

- **Filename** — save your screenshot with this exact name so the build script can find it
- **URL** — the page to open
- **What to capture + what to annotate** — exact instructions
- **Goes in** — which chapter file it belongs in, and which text block it should appear below

Keep all screenshots in this folder as `.png` at **1400–1600px wide**. Retina/2x is fine — pandoc will scale them.

**Annotation tool suggestions:**

- **Linux:** [Flameshot](https://flameshot.org) — free, excellent arrows/boxes/text. Install: `sudo apt install flameshot`
- **Cross-platform (browser):** [Awesome Screenshot Chrome extension](https://chrome.google.com/webstore/detail/awesome-screenshot-and-screen-recorder) — free, annotate in browser
- **Any OS:** Take a screenshot, open in GIMP or Figma, add arrows/callouts

**Style rules for annotations:**

- Arrow colour: `#E05252` (red) — visible on dark and light backgrounds
- Box/highlight: red outline, no fill, 2–3px stroke
- Text labels: bold, 14–16pt, same red
- Add a short caption in the book text immediately below the image reference

---

## Chapter 3 — The job boards (file: 03-part2-job-boards.md)

### SS-01: GermanTechJobs visa sponsorship filter

**File:** `ss-01-germantechjobs-visa-filter.png`
**URL:** https://germantechjobs.de/jobs
**Capture:** The left sidebar with all filters visible.
**Annotate:**
- Red arrow pointing at the "Visa Sponsorship" checkbox/filter
- Red box around the filter label
- Caption text to add below the image in the book: *"Always tick 'Visa Sponsorship' before you scroll. Without it, most listings on GermanTechJobs don't sponsor."*
**Goes after:** the `GermanTechJobs.de` bullet in the Germany Tier 2 boards section

---

### SS-02: HuntUKVisaSponsors — A-rating filter

**File:** `ss-02-hunt-uk-a-rating.png`
**URL:** https://huntukvisasponsors.com
**Capture:** The search interface, showing the "Rating" or "A-rated only" filter option, and one or two result rows so the reader can see what the output looks like.
**Annotate:**
- Red arrow at the "A-rated" toggle/filter
- Red callout box: *"Only A-rated sponsors can issue a Certificate of Sponsorship. B-rated cannot."*
- Red arrow at the "Rating" column in results to reinforce the pattern
**Goes after:** the `HuntUKVisaSponsors.com` bullet in the UK Tier 2 boards section

---

### SS-03: UK Government sponsor register download

**File:** `ss-03-uk-gov-register-download.png`
**URL:** https://www.gov.uk/government/publications/register-of-licensed-sponsors-workers
**Capture:** The full page showing the CSV download link.
**Annotate:**
- Red arrow at the CSV download link
- Red callout: *"Updated monthly. Download this, open in Excel/Sheets, and filter Column D = 'A' to see active sponsors."*
**Goes after:** the `HuntUKVisaSponsors` screenshot or the "Verification" section in Chapter 4.2

---

### SS-04: IND Netherlands public register

**File:** `ss-04-ind-nl-public-register.png`
**URL:** https://ind.nl/en/public-register-recognised-sponsors
**Capture:** The search bar + at least one result row showing a company name and sponsor type.
**Annotate:**
- Red arrow at the search bar
- Red callout: *"If a company is on this list, they can have you working in the Netherlands within 4–8 weeks."*
**Goes after:** the Verification paragraph in Chapter 4.4 (Netherlands)

---

### SS-05: MyVisaJobs — H-1B company search

**File:** `ss-05-myvisajobs-company-search.png`
**URL:** https://www.myvisajobs.com/Search_Visa_Sponsor.aspx
**Capture:** The search form and top results for "Google" or "Amazon" showing columns: company, LCAs, avg salary.
**Annotate:**
- Red arrow at the search input
- Red arrow at the "Average Salary" column
- Red callout: *"Search any company name to instantly see how many H-1B petitions they filed and at what salary."*
**Goes after:** the MyVisaJobs link in Chapter 4.1 (US section)

---

### SS-06: DevJobs.ch — Swiss tech jobs

**File:** `ss-06-devjobs-ch.png`
**URL:** https://devjobs.ch/jobs?relocation=true   (or filter by "Relocation" if available)
**Capture:** The main job listing page with any relocation/sponsorship filter visible.
**Annotate:**
- Red arrow at any "Relocation" or "Visa" filter toggle
- Red callout: *"Switzerland's best tech board. Filter by 'Relocation' — most listings are in Zurich."*
**Goes after:** the `DevJobs.ch` line in the Switzerland Tier 2 boards section

---

### SS-07: Jaabz — visa sponsorship filter in Germany

**File:** `ss-07-jaabz-visa-de.png`
**URL:** https://jaabz.com/jobs/in/germany/visasponsorship
**Capture:** The page showing Germany + visa sponsorship jobs. Show the URL bar so the reader can see the URL pattern `/visasponsorship`.
**Annotate:**
- Red callout on the URL bar: *"Bookmark this URL — it's pre-filtered for Germany + visa sponsorship."*
- Red arrow at one or two job titles with the visa tag visible
**Goes after:** the `Jaabz` bullet under Tier 1 boards

---

### SS-08: Relocate.me — job listing with relocation details

**File:** `ss-08-relocate-me-listing.png`
**URL:** https://relocate.me (open any job listing that shows relocation package details)
**Capture:** A single job listing page — the relocation/sponsorship details box (usually shows "Relocation: yes", visa support, salary, etc.)
**Annotate:**
- Red box around the relocation/visa support section
- Red callout: *"Every listing on Relocate.me shows this block. No block = not confirmed sponsorship."*
**Goes after:** the `Relocate.me` bullet under Tier 1 boards

---

### SS-09: Honeypot — profile visibility settings

**File:** `ss-09-honeypot-profile.png`
**URL:** https://app.honeypot.io (once logged in — create a free account to capture this)
**Capture:** The profile settings showing where to set "Open to opportunities" and relocation countries.
**Annotate:**
- Red arrow at the relocation countries field
- Red callout: *"Set your top 3 countries here. Companies in those countries then approach you — not the other way around."*
**Goes after:** the `Honeypot` bullet under Tier 1 boards

---

## Chapter 4 — Sponsor lists (file: 03-part2-job-boards.md)

### SS-10: LinkedIn job search with visa sponsorship operators

**File:** `ss-10-linkedin-search-operators.png`
**URL:** linkedin.com/jobs — type in the search bar with the operators and take the screenshot
**Capture:** The LinkedIn jobs search bar with a query like:
`"visa sponsorship" backend engineer`
… and the first few results below it, showing jobs with sponsorship mentioned.
**Annotate:**
- Red box around the search bar / query text
- Red callout: *"Use these operators. LinkedIn doesn't have a native sponsorship filter — this is the workaround."*
- Red arrow at one result that has the word "sponsorship" visible in the snippet
**Goes after:** the LinkedIn Tier 3 boards paragraph (the one with the search operator block)

---

## Chapter 8 — Resume / AI tailoring (file: 04-part3-resume-system.md)

### SS-11: Overleaf — LaTeX template preview

**File:** `ss-11-overleaf-template.png`
**URL:** https://www.overleaf.com — upload `resume-template.tex` and screenshot the compiled preview
**Capture:** The split view showing the .tex source on the left and the compiled PDF preview on the right.
**Annotate:**
- Red arrow at the "Compile" button
- Red arrow at the summary/relocation line in the compiled preview
- Red callout: *"This is the template in the bundle. Paste your content, click Compile — done."*
**Goes after:** the "Compiling the template" section in Chapter 7

---

### SS-12: ChatGPT / Claude — Prompt 1 output

**File:** `ss-12-ai-jd-analysis-output.png`
**Instructions:** Run Prompt 1 on any real job description and screenshot the AI's reply showing the numbered lists.
**Annotate:**
- Red box around the "5 ATS keywords" section of the output
- Red callout: *"Copy these 5 keywords. Every single one must appear verbatim in your tailored resume."*
**Goes after:** the Prompt 1 block in Chapter 8

---

## Chapter 10 — Outreach (file: 05-part4-outreach.md)

### SS-13: LinkedIn — finding a recruiter on a company page

**File:** `ss-13-linkedin-recruiter-search.png`
**URL:** linkedin.com — go to any large company page (e.g., Adyen) → People tab → search "recruiter" or "talent"
**Capture:** The People tab search results showing recruiter profiles.
**Annotate:**
- Red arrow at the People tab
- Red arrow at the search box inside it
- Red callout: *"Every tech company has 3–10 recruiters on LinkedIn. Filter by 'Talent' and message the one closest to your region or role."*
**Goes after:** the "Finding recruiters on LinkedIn" section in Chapter 10

---

### SS-14: LinkedIn — Open to Work location settings

**File:** `ss-14-linkedin-open-to-work-cities.png`
**URL:** linkedin.com → your profile → Open to Work → Finding a new job → Preferred locations
**Capture:** The dialog where you add preferred locations.
**Annotate:**
- Red arrow at the location field with example cities filled in (Berlin, Amsterdam, London)
- Red callout: *"Set your target cities here — recruiter InMail inboxes will start filtering toward you."*
**Goes after:** the LinkedIn profile optimisation section (Chapter 8 resume part, or Chapter 10 outreach)

---

## Chapter 12 — Visa question (file: 05-part4-outreach.md)

### SS-15: Levels.fyi — European salary comparison

**File:** `ss-15-levelsfyi-europe.png`
**URL:** https://www.levels.fyi/t/software-engineer?country=Europe (or filter for a specific city)
**Capture:** The comparison table with city and TC columns visible.
**Annotate:**
- Red arrows at 2–3 specific city rows (Berlin, Amsterdam, Zurich)
- Red callout: *"Always compare TC (total comp), not base. Then run both through NettoCalc to get actual take-home."*
**Goes after:** the Levels.fyi entry in the salary research stack (Chapter 15)

---

### SS-16: NettoCalc — side-by-side country comparison

**File:** `ss-16-nettocalc-comparison.png`
**URL:** https://nettocalc.com/compare
**Capture:** Two countries compared (e.g., Germany vs Netherlands), showing gross → net take-home.
**Annotate:**
- Red callout at the net pay row: *"A €120k Munich offer and a €100k Amsterdam offer net almost the same after tax + 30% ruling."*
**Goes after:** the NettoCalc entry in the salary tools list (Chapter 15)

---

## How to insert a screenshot into the markdown

After you capture and annotate a screenshot, add it to the correct `.md` file like this:

```markdown
![Caption describing what the reader should notice](../screenshots/ss-01-germantechjobs-visa-filter.png)
*Caption: Always tick "Visa Sponsorship" before you scroll.*
```

The path `../screenshots/` works relative to the chapter files.

When you run `./build.sh docx`, pandoc will embed all linked images into the .docx automatically.
For PDF, same — images are embedded.
For EPUB, same.

---

## Shortlist: the 5 highest-ROI screenshots to do first

If you only have 30 minutes, do these five — they answer the questions your audience asks most:

1. **SS-02** — UK Hunt UK Visa Sponsors A-rating (eliminates the #1 UK mistake)
2. **SS-05** — MyVisaJobs company search (US H-1B verification in seconds)
3. **SS-01** — GermanTechJobs visa filter (people forget to tick it)
4. **SS-10** — LinkedIn search operators (biggest daily-use tip)
5. **SS-04** — IND NL register (fastest visa in Europe, under-known)
