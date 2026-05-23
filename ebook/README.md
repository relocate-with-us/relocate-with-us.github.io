# The International Tech Job Playbook — Ebook Source

This folder contains the full source for the ebook plus the bundled extras buyers receive.

## Folder structure

```
ebook/
├── README.md                              ← this file (don't ship)
├── PRICING-AND-LAUNCH.md                  ← strategy notes for you (don't ship)
├── THE-INTERNATIONAL-TECH-JOB-PLAYBOOK.md ← the main ebook (ship as PDF)
├── templates/
│   ├── resume-template.tex                ← LaTeX resume buyers get
│   ├── cover-letter.md                    ← cover letter templates
│   ├── outreach-templates.md              ← LinkedIn/email scripts
│   ├── ai-prompts.md                      ← all AI prompts in one file
│   └── sponsor-spreadsheet.md             ← starter spreadsheet content
└── assets/
    └── (cover image goes here)
```

## What buyers get

A single ZIP containing:

1. `The-International-Tech-Job-Playbook.pdf` — the main book
2. `Resume-Template.tex` — ready-to-edit LaTeX resume
3. `AI-Prompts.md` — copy-paste prompts for ChatGPT/Claude
4. `Outreach-Templates.md` — recruiter and hiring-manager scripts
5. `Cover-Letter-Templates.md` — one-page cover letters per country
6. `Sponsor-Spreadsheet-Starter.csv` (optional) — a clean, sortable list

## Building the book

A `build.sh` script handles everything. Install dependencies first:

```bash
sudo apt install pandoc texlive-xetex texlive-fonts-extra zip
```

Then from the `ebook/` folder:

```bash
./build.sh           # builds combined .md, PDF, EPUB, and a buyer-ready ZIP
./build.sh combine   # just produce the combined .md
./build.sh epub      # combined .md + EPUB only (no LaTeX needed)
./build.sh pdf       # combined .md + PDF only
./build.sh zip       # everything + the buyer ZIP bundle
```

Outputs land in `ebook/dist/`. The buyer ZIP (`visajobs-playbook-bundle.zip`) is what you upload to Gumroad.

If you want a polished cover, design one in Canva/Figma at A4 (or 6×9 in) and prepend it manually before zipping.

## Distribution

See `PRICING-AND-LAUNCH.md` for pricing recommendations, platform comparison
(Gumroad vs Payhip vs Lemon Squeezy), and a 30-day launch plan tailored to
your existing channels.
