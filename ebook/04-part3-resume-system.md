# Part 3 — The resume system

This is the meat of the book. If you only read one part, read this one.

The resume system has three components:

1. **The master resume** — a single, comprehensive document of everything you've ever done
2. **The LaTeX template** — the typeset, ATS-friendly format we use to render every tailored version
3. **The AI tailoring loop** — a 5-prompt workflow that takes a job description and produces a tailored resume in 5 minutes

If you set this up once, your application time drops from 60 minutes per role to 5–10 minutes — which is the *only* way to do 200 applications without losing your mind.

## Chapter 6. The master resume method

A master resume is a single private document where you record everything you've done in your career — every project, every metric, every technology, every promotion, every team, every responsibility. It's *not* the document you send. You never send this.

It exists so that when you tailor for a specific job, you have raw material to choose from.

### What goes in the master resume

For every role you've held:

- **Title, company, dates, location, employment type** (FTE / contract / intern)
- **One sentence** about the company (sector, size, what it does)
- **3–8 bullets per role**, each in this format:

  *[Action verb] [what you did] [scale / scope] → [outcome with metric] [tools/tech used]*
  
  Example: "Migrated payment processing from a monolith to 6 Go microservices serving 12M monthly transactions, reducing P95 latency from 380ms to 95ms and saving ~$420k/year in cloud costs (Go, gRPC, Kafka, Postgres, AWS)."
  
- **Key projects** — title, role, scope, technologies, outcome
- **Skills used** — explicit list

For your education:

- Degree, institution, dates, GPA (if strong), thesis topic, honours
- Relevant coursework (only if early-career)
- Notable projects from school

For everything else:

- Open-source contributions (project, role, links)
- Talks given (event, audience size, topic)
- Articles / blog posts (publication, topic, link)
- Patents, papers, certifications
- Languages spoken (with CEFR level)
- Volunteering / non-profit work
- Side projects / startups

The master resume should be **5–10 pages long** when you're done. Mine is 11.

### The "achievement bank"

Within the master resume, maintain a separate section called **Achievement Bank**. This is a flat list of every notable thing you've done, written as standalone bullets, decoupled from a specific role.

Why? Because when you tailor, you'll often pull achievements that span multiple roles, or restate one achievement to emphasize different angles. Having them as a flat list means you can grep, copy, and remix.

Example bank entries:

- "Reduced cloud spend by 35% ($1.2M annual savings) by migrating to spot instances and right-sizing."
- "Mentored 8 junior engineers; 4 promoted within 18 months."
- "Built and shipped MVP of [product] from 0 to 1, used by 200k MAU within 6 months."
- "Authored RFC adopted as company-wide standard for service-to-service auth."
- "Spoke at PyCon EU 2024 on async patterns; 600-person audience; talk in top 10 by recording views."

Aim for **30–60 achievement bullets**. This is your tailoring raw material.

### How to write achievement bullets that work internationally

A bad bullet:
> "Worked on the team that built the new checkout."

A medium bullet:
> "Built the new checkout feature using React and Node.js."

A good bullet:
> "Built and shipped a redesigned checkout flow (React, Next.js, Stripe), increasing conversion by 12% on a base of 4M monthly visitors — directly responsible for ~€2.1M annual revenue uplift."

Notice:

- **Specific tech stack** (ATS-readable)
- **Scope/scale** (4M visitors)
- **Outcome with metric** (12% increase)
- **Business impact translated** (€2.1M)
- **Past tense, active voice, no "responsible for"**

When you don't have exact numbers, estimate conservatively: "approximately," "an estimated." Some quantification beats none.

### The "I" problem in international applications

In US/UK/AU resumes, the convention is to drop pronouns ("Built X" rather than "I built X"). In Germany and Switzerland, slightly fuller sentences are acceptable.

Whatever country you're applying to, **never** write in passive voice ("was built," "was responsible for"). Always lead with the action verb.

---

## Chapter 7. The LaTeX template

Here is the resume template I use. It's clean, ATS-friendly, single-column (multi-column kills ATS parsers), one-page by default, expandable to two when senior.

It's based on a heavily modified version of the popular Awesome-CV / RenderCV / Deedy lineage, but stripped of the things that confuse ATS systems. The full file is provided as `Resume-Template.tex` in your bundle.

A condensed walkthrough of what makes it work:

```latex
\documentclass[a4paper,11pt]{article}
\usepackage[margin=1.6cm]{geometry}
\usepackage{hyperref}
\usepackage{enumitem}
\usepackage{fontawesome5}
\usepackage{titlesec}
\usepackage[T1]{fontenc}
\usepackage{lmodern}
% NOTE: keep fonts standard. Custom fonts (Computer Modern is fine) parse better in ATS than fancy display faces.

\setlist[itemize]{leftmargin=*, topsep=2pt, itemsep=1pt}
\titleformat{\section}{\Large\bfseries}{}{0em}{}[\titlerule]
\titlespacing*{\section}{0pt}{8pt}{4pt}

\hypersetup{
  colorlinks=true,
  urlcolor=black,        % black links print clean; recruiters print
  linkbordercolor={1 1 1},
}
```

Key principles encoded in the template:

1. **Single column.** Multi-column layouts break ATS.
2. **Standard section headers.** "Experience," "Education," "Skills," "Projects." Not "My Journey." Not "Stuff I'm Good At."
3. **Black-on-white.** Color is fine in moderation, but the printable, photocopiable version should look right in pure greyscale.
4. **No tables for layout.** Tables for actual tabular data are fine. Don't use them just to align dates/locations.
5. **Standard fonts.** LM (Latin Modern), Liberation Serif, Source Sans Pro — these all parse cleanly.
6. **Hyperlinks but in black.** Recruiters who print don't want a sea of blue underlines. The link is still there for digital readers.
7. **No header/footer.** ATSs frequently skip header/footer text.
8. **Keep it to 11pt body, 9–10pt for fine print.** Smaller than 9pt and humans struggle.

### The structure

```
[Name — large, bold]
[role — single line summary, e.g. "Senior Backend Engineer | Open to relocation: DE, NL, CH"]
[contact line: email · phone · LinkedIn · GitHub · website · city, country]

— SUMMARY (3 lines max) —
[1 line of professional positioning]
[1 line of biggest achievement / unique angle]
[1 line of relocation/visa statement]

— EXPERIENCE —
[For each role:]
  [Role | Company | dates | location | (Remote)]
  [bullets]

— EDUCATION —
  [Degree, institution, dates]
  [(optional) GPA, thesis, awards]

— SKILLS —
  [Grouped: Languages, Frameworks, Infra, Tools, Spoken languages]

— PROJECTS / OPEN SOURCE / TALKS —
  [Optional, only if strong]
```

### The "above-the-fold" summary line

The first 7 seconds of a recruiter's read decides everything. Your resume's top 1.5 inches must answer:

- *What does this person do?* (role title)
- *Are they who we want?* (seniority signal — years, scope)
- *Will they actually move?* (relocation statement)
- *Will the visa work?* (eligibility statement)

My personal first-line example:

> **Senior Backend Engineer · 6 years · Distributed systems, payments**
> *Eligible for EU Blue Card · Open to relocation to DE / NL / CH · Available within 6 weeks*

This eliminates 80% of recruiter friction. They can immediately decide *yes, this is interesting* or *no, doesn't fit*. If they say yes, they read the rest.

### Compiling the template

The template uses standard LaTeX that compiles with any modern engine:

```bash
pdflatex Resume-Template.tex
# or, with full font support
xelatex Resume-Template.tex
```

Or use [Overleaf](https://overleaf.com) for a zero-install browser experience. Just upload the .tex file and click Compile.

### Why LaTeX over Word/Canva/etc.

- **Version control.** It's text. You can git-track it. Diffs make sense.
- **AI-friendly.** ChatGPT/Claude can read and edit LaTeX directly. Try editing a Canva file with AI. Exactly.
- **Reproducible.** Same input, same output, every time. No "oh, the formatting moved."
- **Beautiful.** Once you tune the template, every resume comes out crisp.
- **ATS-safe.** A clean LaTeX-generated PDF parses well in every modern ATS.

Trust me on this one. The 90 minutes you spend learning enough LaTeX to edit this template pays back forever.

---

## Chapter 8. The AI tailoring loop

Here is the workflow. Five prompts. ~5 minutes per application after the first one. I use Claude (Sonnet or Opus) and ChatGPT (GPT-4 / GPT-5 class) interchangeably; Claude tends to be slightly better at LaTeX, ChatGPT slightly better at hard role-fit reasoning. Try both.

The full prompts are also in `AI-Prompts.md` in your bundle for one-click copy.

### The 5-step loop

**Step 1: Job description analysis**
**Step 2: Master-resume → role-specific draft**
**Step 3: ATS keyword pass**
**Step 4: Recruiter-eye review (rewrite for tone & impact)**
**Step 5: Cover letter / motivation paragraph**

You give the AI: (a) the job description, (b) your master resume, (c) the LaTeX template. You get back a tailored, compiled-ready .tex file plus a cover letter.

### Prompt 1 — Job description analysis

Paste the job description. Use this prompt:

> You are a senior recruiter who has placed engineers at companies like the one in this job description. Read the JD below and extract:
> 
> 1. The 5 most important *hard* skills/technologies, in priority order
> 2. The 3 most important *soft* skills, in priority order
> 3. The 3 things this team is *probably struggling with right now* that motivated this hire
> 4. The 5 keywords or phrases an ATS at this company would index on
> 5. Any signals about visa/relocation friendliness
> 6. The seniority level (junior / mid / senior / staff / principal) and rough TC range you'd expect
> 
> Be concise. Number each list.
> 
> ---
> 
> [paste JD here]

Why this matters: it forces you (and the AI) to read the JD properly and surface the *real* requirements, not the laundry list. The "3 things they're struggling with" question is the one that produces gold — it makes you pitch yourself as a solution, not a candidate.

### Prompt 2 — Master resume → role-specific draft

> Below is my master resume (10 pages, everything I've done). Below that is the analysis you produced of the target job description.
> 
> Generate a tailored 1-page resume in the LaTeX format I'll provide next. Rules:
> 
> 1. The 5 hard skills from the JD analysis must appear naturally in either the summary, the skills section, or experience bullets.
> 2. The "3 things they're struggling with" should be addressed in at least 2 experience bullets where I have relevant evidence.
> 3. Keep the summary to 3 lines. The third line is always the relocation/visa statement (use this exact text: "Eligible for [VISA TYPE]. Open to relocation to [CITIES]. Available within [N] weeks.").
> 4. Order experience bullets within each role by relevance to the JD, not chronologically.
> 5. **Hard rule: do not invent metrics or facts.** Only use information that appears verbatim in the master resume. If you'd like to amplify a claim, ask me to provide the metric.
> 6. Output only the LaTeX content for the body sections (summary, experience, skills, education, projects) — preserve my preamble.
> 
> [paste master resume]
> 
> [paste analysis from Prompt 1]
> 
> [paste your LaTeX template's body section as a structural reference]

Notice the "do not invent metrics" rule. This is the single most important guardrail. Without it, the AI will helpfully fabricate impressive-sounding numbers, and one bad fact-check from a hiring manager will torpedo your application.

### Prompt 3 — ATS keyword pass

> Here is the tailored draft. Here is the ATS keyword list from Prompt 1. 
> 
> Please:
> 
> 1. Confirm each ATS keyword appears at least once in the resume
> 2. For any keyword missing, suggest the most natural place to add it (and the exact wording) without inflating claims
> 3. Flag any spelling variations the ATS might miss (e.g., "React" vs "React.js" vs "ReactJS") — match the JD's exact wording
> 4. Flag any acronyms that should be spelled out at first use
> 
> [paste tailored draft from Prompt 2]
> 
> [paste keyword list]

Apply the changes manually (or paste back and ask the AI to apply them).

### Prompt 4 — Recruiter-eye review

> You are a senior international tech recruiter reviewing the resume below for a [ROLE] role at [COMPANY] in [COUNTRY]. Be brutal. List:
> 
> 1. The 3 things that would make you reject this resume in the first 7 seconds
> 2. The 3 things that would make you say "interesting, talk to this person"
> 3. The bullet that does the *least* work — could be cut or rewritten
> 4. The bullet that does the *most* work — and how to make it even stronger
> 5. Any place where the resume sounds like it was tailored by AI (give me specific phrases)
> 6. Whether the visa/relocation framing is convincing for an international hire to [COUNTRY] specifically
> 
> [paste tailored, ATS-passed resume]

Take this feedback seriously. The "sounds AI-tailored" check is the most valuable — it catches generic phrases like "leveraged synergies" or "spearheaded initiatives" that AI loves and humans hate.

### Prompt 5 — Cover letter / motivation paragraph

For countries that expect cover letters (Germany, Switzerland, France, NL for some roles):

> Write a one-page cover letter in [LANGUAGE] for [ROLE] at [COMPANY], [CITY]. Use the resume below.
> 
> Structure (4 short paragraphs):
> 
> 1. Why this company specifically (1 sentence about the company that proves I read more than the careers page; 1 sentence about why their work matters to me)
> 2. The single strongest piece of evidence I'm a fit (one specific achievement from the resume that maps to their needs — measurable outcome)
> 3. The transferable angle (something from another domain or stack that gives them a non-obvious advantage hiring me)
> 4. Logistics: visa/relocation status, availability, sign-off
> 
> Tone: confident, specific, no clichés. No "I am writing to apply for the position of...". Skip pleasantries. Open with a sentence about *them*, not me.
> 
> [paste tailored resume]

For countries that don't (US, UK most tech roles), skip and use a 4-line "why I applied" message in the application form / LinkedIn message instead.

### Putting it together: my actual workflow

Friday afternoon, 5–8 jobs to apply to:

1. Open my master resume tab (Notion / Google Doc / private repo)
2. Open my LaTeX template in Overleaf
3. For each job:
   - Open Claude/ChatGPT
   - Run Prompt 1 (~30 sec)
   - Run Prompt 2 — get a tailored body section (~60 sec)
   - Paste into Overleaf, swap in the body, compile, eyeball it (~60 sec)
   - Run Prompt 3, apply ATS fixes (~60 sec)
   - Run Prompt 4, fix the AI-tail tells (~60 sec)
   - Run Prompt 5 if cover letter needed (~60 sec)
   - Save as `Resume_LastName_Company_Role_2026.pdf` and `CoverLetter_LastName_Company_2026.pdf`
   - Apply

Per role: 5–7 minutes once you have the loop down. The first few will take 20 minutes. Stick with it.

### Anti-fabrication is non-negotiable

I'll repeat this because the failure mode is the most career-damaging thing in the book.

**Never let AI invent:**
- Specific percentages or dollar amounts
- Team sizes
- Technologies you didn't actually use
- Job titles you didn't actually have
- Companies you didn't actually work for
- Certifications you don't have
- Degrees from institutions you didn't attend

If the AI suggests an impressive metric and you don't have evidence, *delete it*. If you remember the rough number, look up your old emails / git history / OKR docs and use the real one (or "approximately X").

A hiring manager who finds one fabricated detail will assume the whole resume is fake. That's a permanent scar in their mental model of you.

### Example output

You'll see a sample tailored resume in Appendix C using a fictional candidate ("Jordan Vega, Senior Backend Engineer applying to Mollie in Amsterdam"). Compare the original master resume bullets to the tailored version to see how the loop reshapes the same facts for different jobs.

---

## Chapter 9. Country-specific resume tweaks

Most of your resume stays the same across countries. A few sections must change.

### Germany / Austria / Switzerland (Lebenslauf-influenced markets)

For "traditional" companies (banks, insurance, manufacturing, public sector):

- Add a small professional photo top-right (not for startups)
- Include date of birth and nationality at the top
- Length: 2 pages is standard, even acceptable
- Sign and date the resume at the bottom (yes, really — handwritten signature on PDF, scanned)
- Attach copies of your degree certificates and *Arbeitszeugnisse* (employment references) if you have them

For startups and modern tech companies in Berlin/Munich/Zurich:

- US-style English resume is fine
- No photo, no DOB
- 1–2 pages

When in doubt: look at the company's careers page imagery. If the team page shows people in suits, do the formal version. If it shows people in t-shirts at a foosball table, do the modern version.

### United Kingdom

- 1–2 pages, never 3+
- No photo, no DOB, no marital status
- Personal statement (3–4 lines) at the top is expected
- "References available on request" at the bottom (don't list)
- Spelling: British English. "Optimised" not "Optimized." "Behaviour" not "Behavior." "Realised" not "Realized." This matters less than people say but signals attention to detail.

### Netherlands

- 1–2 pages, English, photo optional (slight preference for none in tech)
- Direct, no fluff. Dutch readers despise corporate filler.
- Add explicit "30% ruling eligible" line if you qualify (huge selling point — you cost the company less in net comp)

### United States

- 1 page if <8 years experience, 2 pages if senior+. No exceptions.
- No photo, no DOB, no nationality. Some say to omit address; I include city + state/country only.
- Quantify everything possible. Americans love numbers.
- "Authorized to work in the US" or "Requires H-1B sponsorship" — be explicit.

### France

- French CVs are denser than English ones — 2 pages is normal even at junior level
- French companies like a clear hierarchy: education first if you're <5y experience, experience first if senior
- If applying in French, use standard French CV idioms (e.g., "Maîtrise de" rather than "Proficient in")
- Photo is common but not required

### Spain / Portugal / Italy

- 1–2 pages, English fine for international tech roles
- LinkedIn URL visible
- No DOB required for Spanish/Portuguese tech (older norms aside)
- Mention CEFR levels for Spanish/Portuguese explicitly — many roles require local language for at least B1

### Sweden / Denmark / Norway

- 1–2 pages, English
- Direct, humble tone (Scandinavian *Jantelagen* — don't oversell)
- No photo, no DOB
- "Available immediately" or specific date — Nordics like clarity

### Ireland

- 1–2 pages, English, photo optional but usually omitted
- Tech multinationals (Google, Meta, Stripe Dublin): use US-style resume
- Local Irish companies: more UK-style with personal statement

### Canada

- 1–2 pages, English
- Skill summary box at top is common
- No photo, no DOB, no marital status (illegal for them to consider)
- ATS-heavy market: keyword-mirror the JD aggressively

### Australia

- Up to 3–4 pages acceptable
- "Right to work" status near the top (visa subclass if applicable)
- 2–3 references with full contact details (Australians actually call references)

### A note on multilingual resumes

If you can credibly write a resume in the local language, do it as a *second* document. Submit both. Companies will appreciate the gesture even if they ultimately read only the English one.

If you can't, don't fake it. A poorly-written German Lebenslauf is worse than a perfect English CV.

---

*Next: Part 4 — Outreach.*
