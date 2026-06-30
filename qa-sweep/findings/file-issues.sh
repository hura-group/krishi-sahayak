#!/usr/bin/env bash
#
# file-issues.sh
#
# Files every markdown finding in qa-sweep/findings/ as a real GitHub issue,
# parsing the title and labels from the YAML frontmatter at the top of each
# file. Idempotent-ish: prints what it filed so you can cross-check against
# existing issues before re-running (gh doesn't dedupe for you).
#
# Usage:
#   gh auth login                       # one-time
#   ./labels/setup-labels.sh OWNER/REPO  # run this FIRST — issues reference these labels
#   ./findings/file-issues.sh OWNER/REPO
#
# Example:
#   ./findings/file-issues.sh kisansathi/kisansathi-app

set -euo pipefail

REPO="${1:-}"
if [[ -z "$REPO" ]]; then
  echo "Usage: $0 OWNER/REPO"
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FINDINGS_DIR="$SCRIPT_DIR"

echo "Filing findings from $FINDINGS_DIR against $REPO ..."
echo ""

for file in "$FINDINGS_DIR"/P*.md; do
  [[ -f "$file" ]] || continue

  # Parse frontmatter: title and labels
  title=$(awk -F': ' '/^title:/ {gsub(/"/, "", $2); print $2; exit}' "$file")
  labels=$(awk -F': ' '/^labels:/ {print $2; exit}' "$file" | tr -d ' ')

  # Body = everything after the second "---" line
  body=$(awk 'BEGIN{c=0} /^---$/{c++; next} c>=2{print}' "$file")

  echo "→ Filing: $title"
  echo "  Labels: $labels"

  issue_url=$(gh issue create \
    --repo "$REPO" \
    --title "$title" \
    --label "$labels" \
    --body "$body")

  echo "  ✓ $issue_url"
  echo ""
done

echo "Done. Cross-check against test-matrix.csv and fill in the 'P1 Issues Filed' column with the URLs above."
