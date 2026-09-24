# Wiki Maintenance Operations

This is the operational guide for maintaining the personal learning wiki.

## Quick Reference

| Cadence | Task | Time | Command |
|---------|------|------|---------|
| Weekly | Lint + fix | 10 min | `/lint` |
| Monthly | Review stale pages | 30 min | Pick 10% of `wiki/concepts/` and skim |
| Seasonal | Deep ingest + cross-link | 2-3 weeks | `/ingest raw/topic/` |
| As-needed | Spot fixes | 5-10 min | Fix on the spot during `/learn` or `/query` |

---

## Weekly Check

**Frequency**: Every Monday (or after major ingest sessions)

**Steps**:
1. Run `/lint`
2. Review output:
   - **CRITICAL** (broken links, missing entries): Fix immediately
   - **IMPORTANT** (orphan pages, undefined refs): Fix within the week
   - **NICE-TO-HAVE**: Log for seasonal review
3. Make fixes
4. Commit to git (if applicable)

**Example output check**:
```
CRITICAL (0 issues): ✓ Clean
IMPORTANT (2 issues):
  - [[xyz]] page not in index.md
  - [[foo]] references [[undefined-thing]]
```

Action: 10-minute fix, done.

---

## Monthly Review

**Frequency**: Last Friday of the month

**Steps**:
1. Count pages in `wiki/concepts/`: e.g., 50 pages
2. Pick 10% (5 pages) at random
3. For each page:
   - Skim the definition and example
   - Check: Is the date old (>6 months)? Is the content still accurate?
   - Make a note: "Still valid", "Needs update", or "Archive"
4. Log your findings (update `log.md`)

**Example**:
```
## [2026-10-24] review | Monthly wiki health check

- Reviewed 5 random pages (10% sample)
- Still valid: [[postgres-connections]], [[jwt-authentication]], [[nx-monorepo]]
- Needs update: [[scaling]] (referenced v17, now v18)
- Stale concept: [[streaming-json]] (haven't used in 8 months, consider archiving)

Notes: Performance pages are stable. Jarvis pages could use version bumps.
```

---

## Seasonal Deep Dive (Once per quarter)

**Duration**: 2-3 weeks (can split into multiple sessions)

**Choose a topic**: Pick one area you want to master. Examples:
- "Postgres deep dive" (connections, performance, transactions)
- "Kubernetes patterns" (deployments, HPA, operators)
- "Jarvis model training" (end-to-end flow)

**Week 1: Ingest**
1. List all raw material for the topic
   ```bash
   ls raw/database/postgres/
   ls raw/jarvis/EXTERNAL-INTEGRATIONS.md
   ```
2. Read everything, take notes
3. Run `/ingest raw/database/postgres/` (or each file individually)
4. Create new pages where needed
5. Update existing pages with new findings
6. Log the changes

**Week 2: Cross-link & Q&A**
1. Review "Related Concepts" in each new/updated page
2. Add reciprocal links (if A → B, then B → A)
3. Create 2-3 Q&A pairs testing the new knowledge
4. Update `qa/index.md` with new pairs

**Week 3: Validate**
1. Use `/learn` on the topic — test if pages make sense
2. Spot issues? Fix immediately
3. Run `/lint` — verify 0 broken links
4. Final log entry with metrics:
   - X new pages created
   - Y pages updated
   - Z new cross-links
   - N Q&A pairs added

**Example log entry**:
```
## [2026-10-15] ingest | Seasonal deep dive: PostgreSQL performance

- Created: [[postgres-performance]], [[query-optimization]], [[indexing-strategy]]
- Updated: [[postgres-connections]] (added performance tuning), [[neon-lakebase]] (added performance section)
- Linked: 6 new cross-references added across database pages
- Q&A: Added q-postgres-index-types, q-postgres-slow-query-debug, q-postgres-connection-pooling
- Notes: Full source is raw/database/postgres/performance.md. Some best practices marked as general knowledge (replication, monitoring tooling). Verified 0 broken links via `/lint`.

Outcome: Database section now has 15 pages (was 8), comprehensive coverage of performance tuning.
```

---

## Spot Fixes (During Learning)

**When to do this**: While using `/learn`, `/query`, or reading a page, you notice a problem.

**Examples**:
- Typo in a page
- Broken link `[[missing-page]]`
- Example code that doesn't work
- Related concept missing

**Steps**:
1. Fix the page immediately
2. Log it in the next weekly/monthly check (don't need immediate log entry)

**Example**:
```
During /learn on [[jwt-authentication]], noticed:
- Typo: "JSON Web Totken" → "JSON Web Token" (fixed)
- Missing related: [[adfs-authentication]] not linked (added)
- Example code had wrong import (fixed)
```

---

## Git Workflow (Optional)

If you're using git for version control:

### After Weekly Lint
```bash
git add -A
git commit -m "lint: fix broken links and orphan pages"
```

### After Seasonal Deep Dive
```bash
git add -A
git commit -m "feat: PostgreSQL performance deep dive

- Created 3 new concept pages
- Updated 2 existing pages with performance guidance
- Added 3 Q&A pairs for practice
- Verified all links via lint
"
```

---

## Metrics to Track

Keep simple metrics in a notes file or `log.md` comments:

- **Total pages**: Growth rate (e.g., 50 → 53 this month)
- **Broken links**: Should always be 0 after `/lint` fixes
- **Orphan pages**: Should always be 0
- **Q&A pairs**: Track total and ratio of asked:generated
- **Stale pages**: % of pages >6 months old (review before they decay)

Example (monthly):
```
Sep 24: 49 pages, 13 Q&A, 0 broken links, 0 orphans
Oct 24: 52 pages, 16 Q&A, 0 broken links, 0 orphans (3 pages added, 5% month-over-month growth)
```

---

## Troubleshooting

### "Too many broken links to fix manually"

If `/lint` shows >5 broken links, use the `/lint` output to batch-fix:
1. Run `/lint`, save the output
2. Group issues by type (missing pages, bad links, etc.)
3. Fix by category (e.g., "all missing [[foo-*]] pages")

### "I have orphan pages but don't want to delete them"

Move them to `archive/` subdirectory:
```bash
mv wiki/concepts/old-concept.md archive/old-concept.md
```

Update `index.md` to reference archived pages separately if needed.

### "Too many pages, can't review all of them"

Sample randomly instead of trying to review everything:
- 10-50 pages: Review 10% (1-5 pages) monthly
- 50-200 pages: Review 5% (3-10 pages) monthly
- 200+ pages: Review 2-3 pages monthly

You'll catch drift over time without burning out.

---

## Checklist for Seasonal Deep Dive

Use this checklist when starting a new topic:

- [ ] List all relevant raw material
- [ ] Read all raw files thoroughly
- [ ] Identify all concepts to extract
- [ ] Create new pages (or update existing)
- [ ] Add examples and mental models
- [ ] Cross-link related concepts
- [ ] Verify reciprocal links (A→B means B→A)
- [ ] Create 2-3 Q&A pairs
- [ ] Update `qa/index.md`
- [ ] Update main `index.md` with new pages/sections
- [ ] Run `/lint` and fix all CRITICAL/IMPORTANT issues
- [ ] Test pages with `/learn` on the topic
- [ ] Log all changes with metrics
- [ ] Commit to git (optional)

---

## Long-term Health

**Quarterly health check** (use `/lint`):
- 0 broken links?
- 0 orphan pages?
- 0 undefined references?
- All pages have Definition, Mental Model, Example, Related Concepts, Sources?
- Q&A index complete and all pairs verified?

If you maintain these numbers, your wiki stays healthy indefinitely.
