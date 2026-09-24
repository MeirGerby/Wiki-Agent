# Wiki Maintenance

## Definition

Wiki maintenance is the ongoing practice of preserving, validating, and expanding a knowledge base to ensure it remains useful, accurate, and connected over time. For a personal wiki, this means preventing decay, fixing broken links, merging duplicates, and keeping information fresh without letting it become a burden.

## Mental Model

Think of a wiki like a garden:
- **Planting** is ingesting raw material into new pages
- **Weeding** is removing orphans and duplicates
- **Pruning** is keeping pages concise and linked
- **Watering** is reviewing old pages to confirm they're still accurate
- **Harvesting** is using the wiki to learn — which surfaces gaps

A garden left untended becomes overgrown. A wiki left unmaintained becomes a graveyard of broken links and stale information.

The key insight: **maintenance is not separate from building**. Each operation (ingest, learn, query) surfaces problems that maintenance fixes. You don't need perfect processes — you need regular small checks that catch drift before it becomes a mess.

## Practices

### Weekly (10 minutes)
- **Lint**: Run `/lint` to catch broken links, orphan pages, or missing backlinks before they accumulate.
- **Fix**: Address CRITICAL issues (broken links, missing entries) immediately.

### Monthly (30 minutes)
- **Review stale pages**: Pick a random 10% of pages and skim them. Note updates or removals needed.
- **Update log.md**: Record any patterns you're seeing (e.g., "Q&A pairs in Topic X are weak").

### Seasonal (2-3 weeks, once per quarter)
- **Deep ingest**: Choose one topic and read all raw material thoroughly. Extract all concepts, create new pages, merge related ones, add Q&A pairs.
- **Cross-link**: After ingestion, review "Related Concepts" sections across pages you touched. Add reciprocal links if missing.

### As-needed (during learning)
- **Spot fixes**: When you `/learn` or `/query` and find a broken reference, fix it on the spot.
- **Aha moments**: If you learn something that contradicts or extends a page, update it immediately while fresh.

## Example

**Scenario**: You start a deep dive into PostgreSQL performance.

Week 1:
1. Read everything in `raw/database/postgres/`.
2. Create pages: `[[postgres-performance]]`, `[[query-optimization]]`, `[[indexing]]`.
3. Update existing `[[postgres-connections]]` to link to the new pages.
4. Add 2-3 Q&A pairs: "How do indexes speed up queries?" etc.
5. Log the work.

Week 2:
1. Use the pages in `/learn` — test if they make sense.
2. Spot issues? Fix them immediately (typos, missing examples, unclear wording).
3. Notice that `[[scaling]]` and `[[postgres-performance]]` overlap? Decide: merge or keep separate with clear boundaries.
4. Final lint check, update log.

Result: 3 new pages, 1 updated page, 2-3 Q&A pairs, 0 orphans, 100% of links verified.

## Workflow

The full workflow for any operation:

```
1. Do the work (ingest, learn, query, fix)
2. Update pages + index + links
3. Lint: `/lint`
4. Fix issues (CRITICAL first, then IMPORTANT)
5. Log the work
```

This is simple but requires discipline. The temptation is to skip linting or logging. Don't. A wiki without a log is unmaintainable.

## Related Concepts

- [[index]] — Where pages are registered
- [[log]] — Audit trail of all changes

## Sources

- `MAINTENANCE.md` — Step-by-step operational guide
