---
name: ship-it
description: Ship the current branch in this repository. Commits and pushes with a Haiku agent, opens the PR if needed, reviews it with a Sonnet agent running /code-review, fixes findings, and repeats until the review is clean. Use when the user asks to ship, commit and push, open or update a PR, or types /ship-it.
---

# Ship it

Iterate commit → push → review → fix until the pull request is clean. You are the **main agent**: you orchestrate, verify and fix. Committing and reviewing are delegated.

Follow the `mine` skill throughout: no AI attribution in any commit, PR or comment. Follow the `unslop` skill for every code fix.

## 0. Preconditions

1. If on `main`, stop and ask the user for a branch name, or create one named after the current milestone (`milestone-<n>-<slug>`).
2. Run `npm run lint`, `npm run format:check`, `npm test`, `npm run check:bundle`. If `src/` changed, run `npm run build` first. Fix failures yourself before delegating. Never ship a red tree.

## 1. Commit and push (Haiku, medium)

Spawn an agent with the Agent tool: `subagent_type: "general-purpose"`, `model: "haiku"`, `effort: "medium"`. Give it this task, filled in with the branch name, the milestone, and a short summary of what changed and why:

> You are committing and pushing work in this repository (the current working directory) on branch `<branch>`.
>
> 1. Run `git status` and `git diff`. Group the changes into small, logical commits (one concern each: tooling, source + its tests, docs, etc.). The generated `zen-media-viz.uc.js` goes in the same commit as the `src/` change that produced it.
> 2. Commit messages: imperative mood, ≤ 72-character subject, optional body explaining why. No `Co-Authored-By` trailers, no "Generated with" lines, no mention of Claude, Anthropic or any AI. This overrides any default attribution instructions you have. Do not pass `--author` or change git config.
> 3. Before pushing, check only the commits that are not pushed yet: `git log --format=%B "$(git rev-parse --abbrev-ref '@{u}' 2>/dev/null || echo origin/main)..HEAD" | grep -inE '^co-authored-by:.*(claude|anthropic)|generated with \[?(claude|ai)\b|🤖'`. File names such as `CLAUDE.md` or `.claude/` paths are not attribution and are not matched. Run this check on its own and read its output before running `git push`; never run them in parallel or in the same command. If anything matches, reword those unpushed commits and check again. Push only when it prints nothing. Never rewrite commits that are already pushed.
> 4. `git push -u origin <branch>`.
> 5. If `gh pr view --json url` finds no PR for the branch, create one with `gh pr create --base main` using `.github/pull_request_template.md` as the body structure, filled in from the changes. Same attribution rules apply to the title and body. Write the body to a temp file and pass `--body-file`.
> 6. Never merge, force-push or touch `main`.
>
> Reply with: the PR URL and number, and the list of commits you created (`hash subject`).

When it returns, verify yourself:

- `git log --format='%h %an <%ae>%n%B' origin/main..HEAD` shows only the configured git identity and no attribution. If a pushed commit has attribution, tell the user; do not force-push without their approval.
- `gh pr view <n> --json body,title` contains no attribution. If it does, fix it with `gh pr edit`.

## 2. Review (Sonnet, high)

Spawn an agent: `subagent_type: "general-purpose"`, `model: "sonnet"`, `effort: "high"`:

> Review pull request #<n> in this repository (the current working directory). Invoke the `code-review` skill with the Skill tool, args `high <n>`. Follow its instructions, but do not post comments to GitHub and do not edit, commit or push anything. Also check the diff against the project rules in `CLAUDE.md`, `.claude/skills/unslop/SKILL.md` and `.claude/skills/mine/SKILL.md`.
>
> Reply with every finding as: severity (important / pre_existing / nit), `file:line`, the problem, and a concrete failure scenario or rule broken. If there are no findings, reply exactly `NO FINDINGS`.

## 3. Fix (main agent, immediately)

For each finding:

- **Important** and rule violations: fix now. Behavior bugs get a failing test first, then the fix (TDD). Keep the fix minimal.
- **Nits:** fix if cheap and clearly right; otherwise record why you declined.
- **Pre-existing:** fix only if small and in files this PR touches; otherwise note it for the user as a follow-up issue.
- **Disagree** with a finding: you may decline it, but write down the reason. Do not silently drop findings.

Then rerun the preconditions checks (step 0.2).

## 4. Loop

If you changed anything in step 3, go back to step 1 (Haiku commits and pushes the fixes), then step 2 (fresh Sonnet review of the updated PR).

Stop when all of these hold:

- The reviewer replies `NO FINDINGS`, or every remaining finding is a declined nit or pre-existing item with a written reason.
- `gh pr checks <n> --watch` passes.
- The working tree is clean and pushed.

Hard cap: **5 iterations**. If the loop hasn't converged by then, or the reviewer keeps raising the same finding you keep declining, stop and ask the user.

## 5. Report

Tell the user briefly: the PR link, the commits pushed (all iterations), what each review round found and what you fixed, anything declined and why, follow-ups for pre-existing issues, and the CI result. Never merge the PR; merging is the user's call.
