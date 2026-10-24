#!/usr/bin/env bash
#
# setup-labels.sh
#
# Creates every label the Polish QA Sweep needs in the target repo.
# Idempotent — safe to re-run; `gh label create --force` overwrites
# color/description on existing labels rather than erroring.
#
# Usage:
#   gh auth login                    # one-time, if not already authenticated
#   ./setup-labels.sh OWNER/REPO
#
# Example:
#   ./setup-labels.sh kisansathi/kisansathi-app

set -euo pipefail

REPO="${1:-}"
if [[ -z "$REPO" ]]; then
  echo "Usage: $0 OWNER/REPO"
  echo "Example: $0 kisansathi/kisansathi-app"
  exit 1
fi

echo "Setting up QA Sweep labels on $REPO ..."

# ── Severity (the two that matter for the Week 15 target) ────────────────────
gh label create "P1"          --repo "$REPO" --color "B60205" --description "Must fix before launch"        --force
gh label create "P2"          --repo "$REPO" --color "FBCA04" --description "Can launch, fix later"          --force

# ── Process label — lets you filter "everything from this sweep" ─────────────
gh label create "qa-sweep"    --repo "$REPO" --color "5319E7" --description "Found during the Polish QA Sweep" --force

# ── Language dimension ─────────────────────────────────────────────────────────
gh label create "lang:en"     --repo "$REPO" --color "0E8A16" --description "English"  --force
gh label create "lang:hi"     --repo "$REPO" --color "0E8A16" --description "Hindi"    --force
gh label create "lang:gu"     --repo "$REPO" --color "0E8A16" --description "Gujarati" --force

# ── Theme dimension ────────────────────────────────────────────────────────────
gh label create "theme:light" --repo "$REPO" --color "FEF2C0" --description "Light mode" --force
gh label create "theme:dark"  --repo "$REPO" --color "1D2129" --description "Dark mode"  --force

# ── Platform dimension ─────────────────────────────────────────────────────────
gh label create "platform:android" --repo "$REPO" --color "C2E0C6" --description "Android (mid-range)" --force
gh label create "platform:ios"     --repo "$REPO" --color "BFDADC" --description "iOS"                  --force

# ── Category — separates "this screen has a bug" from "infra is missing" ─────
gh label create "infra-blocker" --repo "$REPO" --color "D93F0B" --description "Blocks the test matrix itself (e.g. no dark mode / i18n system yet)" --force

echo ""
echo "✓ Done. Verify with: gh label list --repo $REPO"
