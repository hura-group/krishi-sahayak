## 📋 What does this PR do?

<!-- One clear sentence. E.g. "Adds the 7-day weather forecast screen with rain probability ring." -->

---

## 🔗 Linked Issue / Task

<!-- Notion task URL or GitHub issue number -->
- Task: 
- Branch: `feat/...`

---

## 🧪 How to test

<!-- Step-by-step instructions for the reviewer to verify this works -->

1. Pull this branch and run `pnpm start`
2. Navigate to ...
3. Verify that ...

---

## 📸 Screenshots / Screen Recording

<!-- Required for any UI change. Drag & drop images or a .gif here. -->

| Before | After |
|--------|-------|
| —      | —     |

---

## ✅ Checklist

- [ ] Follows branch naming convention (`feat/`, `fix/`, `chore/`, etc.)
- [ ] Commit messages follow Conventional Commits format
- [ ] No `console.log` left in code (use `console.warn` / `console.error`)
- [ ] No hardcoded API keys or secrets — all via `process.env`
- [ ] TypeScript strict — zero `any` types
- [ ] All new components have explicit prop types
- [ ] Error states handled with `try/catch` and user-visible feedback
- [ ] ESLint passes locally (`pnpm lint`)
- [ ] TypeScript passes locally (`pnpm typecheck`)
- [ ] Tested on both iOS Simulator and Android Emulator (for mobile changes)
- [ ] Analytics events fired where appropriate (`track()` from `src/analytics`)
- [ ] PR is small and focused — one feature or fix only

---

## 🚨 Breaking changes?

<!-- Does this change anything that could break other parts of the app? -->
- [ ] No breaking changes
- [ ] Yes — describe impact below:

---

## 💬 Notes for reviewer

<!-- Anything the reviewer should know: edge cases, known issues, decisions made, etc. -->
