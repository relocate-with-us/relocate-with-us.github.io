# AI Prompts — quick-reference

The 5 prompts that drive the tailoring loop, plus 3 bonus prompts for interview prep, salary research, and outreach personalisation. Paste into ChatGPT, Claude, or any modern LLM.

> Tip: keep your **master resume** in a separate doc. Paste it once at the start of a chat session, and reuse the same chat across all 5 prompts for a single application — the model retains context.

---

## Prompt 1 — Job description analysis

```
You are a senior recruiter who has placed engineers at companies like the
one in this job description. Read the JD below and extract:

1. The 5 most important hard skills/technologies, in priority order
2. The 3 most important soft skills, in priority order
3. The 3 things this team is probably struggling with right now that
   motivated this hire
4. The 5 keywords or phrases an ATS at this company would index on
5. Any signals about visa/relocation friendliness
6. The seniority level (junior / mid / senior / staff / principal) and
   rough TC range you'd expect

Be concise. Number each list.

---

[paste JD here]
```

---

## Prompt 2 — Master resume → role-specific draft

```
Below is my master resume (10 pages, everything I've done). Below that
is the analysis you produced of the target job description.

Generate a tailored 1-page resume in the LaTeX format I'll provide
next. Rules:

1. The 5 hard skills from the JD analysis must appear naturally in
   either the summary, the skills section, or experience bullets.
2. The "3 things they're struggling with" should be addressed in at
   least 2 experience bullets where I have relevant evidence.
3. Keep the summary to 3 lines. The third line is always the
   relocation/visa statement (use this exact text: "Eligible for
   [VISA TYPE]. Open to relocation to [CITIES]. Available within
   [N] weeks.").
4. Order experience bullets within each role by relevance to the JD,
   not chronologically.
5. Hard rule: do not invent metrics or facts. Only use information
   that appears verbatim in the master resume. If you'd like to
   amplify a claim, ask me to provide the metric.
6. Output only the LaTeX content for the body sections (summary,
   experience, skills, education, projects) — preserve my preamble.

[paste master resume]

[paste analysis from Prompt 1]

[paste your LaTeX template's body section as a structural reference]
```

---

## Prompt 3 — ATS keyword pass

```
Here is the tailored draft. Here is the ATS keyword list from
Prompt 1.

Please:

1. Confirm each ATS keyword appears at least once in the resume
2. For any keyword missing, suggest the most natural place to add it
   (and the exact wording) without inflating claims
3. Flag any spelling variations the ATS might miss (e.g., "React" vs
   "React.js" vs "ReactJS") — match the JD's exact wording
4. Flag any acronyms that should be spelled out at first use

[paste tailored draft from Prompt 2]

[paste keyword list]
```

---

## Prompt 4 — Recruiter-eye review

```
You are a senior international tech recruiter reviewing the resume
below for a [ROLE] role at [COMPANY] in [COUNTRY]. Be brutal. List:

1. The 3 things that would make you reject this resume in the first
   7 seconds
2. The 3 things that would make you say "interesting, talk to this
   person"
3. The bullet that does the least work — could be cut or rewritten
4. The bullet that does the most work — and how to make it even
   stronger
5. Any place where the resume sounds like it was tailored by AI (give
   me specific phrases)
6. Whether the visa/relocation framing is convincing for an
   international hire to [COUNTRY] specifically

[paste tailored, ATS-passed resume]
```

---

## Prompt 5 — Cover letter / motivation paragraph

```
Write a one-page cover letter in [LANGUAGE] for [ROLE] at
[COMPANY], [CITY]. Use the resume below.

Structure (4 short paragraphs):

1. Why this company specifically (1 sentence about the company that
   proves I read more than the careers page; 1 sentence about why
   their work matters to me)
2. The single strongest piece of evidence I'm a fit (one specific
   achievement from the resume that maps to their needs — measurable
   outcome)
3. The transferable angle (something from another domain or stack
   that gives them a non-obvious advantage hiring me)
4. Logistics: visa/relocation status, availability, sign-off

Tone: confident, specific, no clichés. No "I am writing to apply
for the position of...". Skip pleasantries. Open with a sentence
about *them*, not me.

[paste tailored resume]
```

---

## Bonus 1 — Interview prep

```
You're a hiring manager at [COMPANY] interviewing me for [ROLE].
Based on the JD pasted below and my resume pasted after, generate:

1. The 7 most likely behavioural questions you'd ask
2. The 5 most likely technical questions for this role/level
3. 3 system-design prompts at the right scope for this seniority
4. 3 questions you'd specifically ask an international candidate
   (visa, relocation, motivation)

For each, include a 1-sentence note on what the interviewer is
secretly assessing.

[paste JD]
[paste resume]
```

---

## Bonus 2 — Salary research

```
Based on the role below at [COMPANY] in [CITY], using public data
sources you have knowledge of (Levels.fyi, Glassdoor, Honeypot,
Blind, GermanTechJobs salary guide, etc.), give me:

1. Realistic base salary range (gross)
2. Realistic total compensation range
3. Typical equity component for this seniority at this company type
4. Effective tax rate at the median TC for this city
5. Net monthly take-home for someone at the median offer
6. The single biggest negotiation lever an international candidate
   has at this company / role / level

Cite the data confidence level (high / medium / low) for each.

[paste JD or describe role]
```

---

## Bonus 3 — Outreach personalisation

```
I'm about to message [Name], [Title] at [Company]. Their LinkedIn
shows [list 2-3 facts from their profile]. Recent post / article /
talk: [paste 1-2 sentences].

Write a 90-word LinkedIn DM from me that:
- Opens with something specific about their work (not "I love your
  company")
- Mentions one of my achievements that's relevant (use the most
  relevant from my resume below)
- Asks exactly one question
- Sounds like a senior peer, not a job-seeker in distress

[paste relevant section of your master resume]
```

---

## Bonus 4 — Master-resume audit

Use this once when you first build the master resume.

```
Below is my master resume — every role, project, and achievement.
Audit it as if you were a hiring panel for senior roles at top tech
companies in [TARGET COUNTRIES].

1. List the 10 strongest bullets across all my roles, ranked.
2. List the 10 weakest — flag the specific weakness (no metric, vague
   verb, unclear scope, etc.).
3. Identify any gap or missing evidence for the kind of roles I'm
   targeting (e.g., "no evidence of mentoring/leadership," "no
   metrics on system performance," "no cross-functional impact").
4. Suggest 5 questions I should ask my past managers to help me
   recover quantitative evidence I might have lost.
5. Flag any inconsistencies in dates, titles, or claims across the
   document.

[paste master resume]
[describe target roles / countries]
```
