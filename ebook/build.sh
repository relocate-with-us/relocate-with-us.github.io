#!/usr/bin/env bash
# build.sh — concatenate the chapter files and produce the final PDF + EPUB.
#
# Usage:
#   ./build.sh           # builds PDF and EPUB in ./dist
#   ./build.sh pdf       # PDF only
#   ./build.sh epub      # EPUB only
#   ./build.sh combine   # only produce the combined .md file
#
# Requirements:
#   - pandoc
#   - a LaTeX engine (xelatex recommended) — install via texlive-xetex on Linux
#
# Output:
#   ./dist/The-International-Tech-Job-Playbook.md   (combined source)
#   ./dist/The-International-Tech-Job-Playbook.pdf
#   ./dist/The-International-Tech-Job-Playbook.epub

set -euo pipefail

BOOK_TITLE="The International Tech Job Playbook"
BOOK_AUTHOR="VisaJobs.xyz"
BOOK_SUBTITLE="How to land a visa-sponsored tech job abroad in 2026"

DIR="$(cd "$(dirname "$0")" && pwd)"
DIST="$DIR/dist"
mkdir -p "$DIST"

CHAPTERS=(
  "00-cover-and-front-matter.md"
  "01-foreword.md"
  "02-part1-strategy.md"
  "03-part2-job-boards.md"
  "04-part3-resume-system.md"
  "05-part4-outreach.md"
  "06-part5-interviews-and-salary.md"
  "07-part6-visa-and-relocation.md"
  "08-part7-first-90-days.md"
  "09-appendices.md"
)

COMBINED="$DIST/The-International-Tech-Job-Playbook.md"

combine() {
  echo ">> combining chapters into $COMBINED"
  : > "$COMBINED"
  for f in "${CHAPTERS[@]}"; do
    cat "$DIR/$f" >> "$COMBINED"
    echo -e "\n\n" >> "$COMBINED"
  done
  echo ">> wrote $(wc -l < "$COMBINED") lines"
}

build_pdf() {
  echo ">> building PDF"
  pandoc "$COMBINED" \
    -o "$DIST/The-International-Tech-Job-Playbook.pdf" \
    --pdf-engine=xelatex \
    --toc --toc-depth=2 \
    -V geometry:margin=2cm \
    -V mainfont="Liberation Serif" \
    -V monofont="DejaVu Sans Mono" \
    -V linkcolor=blue \
    -V urlcolor=blue \
    -V fontsize=11pt \
    -V documentclass=report \
    --metadata title="$BOOK_TITLE" \
    --metadata subtitle="$BOOK_SUBTITLE" \
    --metadata author="$BOOK_AUTHOR" \
    --metadata date="$(date +%Y)"
  echo ">> wrote $DIST/The-International-Tech-Job-Playbook.pdf"
}

build_epub() {
  echo ">> building EPUB"
  pandoc "$COMBINED" \
    -o "$DIST/The-International-Tech-Job-Playbook.epub" \
    --toc --toc-depth=2 \
    --metadata title="$BOOK_TITLE" \
    --metadata subtitle="$BOOK_SUBTITLE" \
    --metadata author="$BOOK_AUTHOR" \
    --metadata language=en
  echo ">> wrote $DIST/The-International-Tech-Job-Playbook.epub"
}

build_docx() {
  echo ">> building DOCX (for Google Docs import)"
  pandoc "$COMBINED" \
    -o "$DIST/The-International-Tech-Job-Playbook.docx" \
    --toc --toc-depth=2 \
    --metadata title="$BOOK_TITLE" \
    --metadata subtitle="$BOOK_SUBTITLE" \
    --metadata author="$BOOK_AUTHOR"
  echo ">> wrote $DIST/The-International-Tech-Job-Playbook.docx"
}

bundle_zip() {
  echo ">> packaging buyer ZIP"
  ZIP="$DIST/visajobs-playbook-bundle.zip"
  rm -f "$ZIP"
  ( cd "$DIR" && zip -j "$ZIP" \
    "$DIST/The-International-Tech-Job-Playbook.pdf" \
    "$DIST/The-International-Tech-Job-Playbook.epub" \
    "templates/resume-template.tex" \
    "templates/ai-prompts.md" \
    "templates/outreach-templates.md" \
    "templates/cover-letter-templates.md" \
    "templates/sponsor-spreadsheet-starter.csv" \
  )
  echo ">> wrote $ZIP"
}

case "${1:-all}" in
  combine) combine ;;
  pdf)     combine; build_pdf ;;
  epub)    combine; build_epub ;;
  docx)    combine; build_docx ;;
  zip)     combine; build_pdf; build_epub; build_docx; bundle_zip ;;
  all|*)   combine; build_pdf; build_epub; build_docx; bundle_zip ;;
esac

echo "done."
