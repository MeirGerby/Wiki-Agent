---
name: study
description: Study coach for this wiki. Builds a study plan, flashcards, quizzes and spaced-review sessions from wiki pages, and tracks progress in learn/profile.md. Use when the user wants to study, revise, memorize or be tested on a topic.
---

# Study

Turn wiki pages into active study material and track what sticks. This skill is about
*retention* (practice, testing, spacing). For a first explanation of a topic, use `/learn`
or the `learner-tutor` agent instead.

## Modes

Pick the mode from the request. If unclear, ask once: plan, cards, quiz, or review?

| Mode | Use when | Output |
| --- | --- | --- |
| `plan` | "How do I study X?" / a goal with a deadline | Ordered list of wiki pages, 45-60 min daily blocks, checkpoints |
| `cards` | "Make flashcards" | Question/answer pairs, one fact each |
| `quiz` | "Test me" | 5-10 questions, mixed types, answers hidden until the user replies |
| `review` | Returning to material studied before | Short retrieval check on items due in `learn/profile.md` |
| `summary` | "Summarize for revision" | One-page recap in the user's own words, with a gap list |

## Workflow

1. **Read the profile**: `learn/profile.md` (goals, Known with dates, Gaps, what helps). Skip what is already solid.
2. **Find the material**: search `index.md`, then read the relevant `wiki/concepts/` and `wiki/commands/` pages and their Related Concepts. Cite pages with `[[links]]`.
3. **Run the mode** (below).
4. **Give feedback**: say what was right, correct what was wrong, and point to the wiki page.
5. **Update the profile** (only `learn/profile.md`): move items between Known and Gaps and set `last reviewed` dates. Tell the user what changed.
6. **Offer next step**: the weakest item to revisit, or the next Related Concept.

## Mode details

**plan**
- Break the goal into pages in dependency order (prerequisites first).
- Daily block, from the learning path: 10 min concept, 25 min practice, 10 min short written summary, 5 min recall without notes.
- Place a review of earlier material every 3rd session.
- Output a table: day, pages, practice task, check question.

**cards**
- One idea per card. Prefer "why", "when" and "what happens if" over definitions.
- Use cloze for commands: `ss -___ ` (listening ports and programs) is better than "what does ss do".
- Format: `Q: ... / A: ...` with the source page. Save to `learn/cards/<topic>.md` only if the user asks.

**quiz**
- Mix recall (explain), application (predict the output, spot the bug) and comparison (X vs Y).
- Ask one question at a time unless the user wants a batch. Do not show the answer first.
- After each answer: correct / partly / wrong, one-line reason, link to the page.

**review**
- Choose the 1-3 *Known* items with the oldest `last reviewed` date.
- Ask without hints. Solid answer: refresh the date. Shaky: move to Gaps and re-teach briefly.

**summary**
- Ask the user to say it in their words first, then compare with the wiki and list what is missing.

## Study techniques to apply

- **Retrieval practice**: asking beats rereading.
- **Spacing**: revisit after 1 day, 3 days, 1 week, 2 weeks.
- **Interleaving**: mix related topics (for example `ss`, `nmap` and `ufw`) in one quiz.
- **Explain it simply**: if the user cannot explain it in two sentences, it is a gap.
- **Hands-on**: pair commands with a lab exercise from `raw/learn/cyber-linux/steps/` and run it in the isolated lab.

## Rules

- Never modify `raw/` or `wiki/`. If the session produces new knowledge, suggest `/ingest`.
- Write only to `learn/` (profile, and cards/plans when asked).
- Mark anything beyond the wiki as general knowledge. Do not invent facts.
- Keep sessions short; stop after one chunk and let the user react.
- For security topics, keep practice on systems the user owns or in the isolated lab.
