# Linear Issue Tracker

## Definition

Issues and specs for Jarvis live in **Linear**, team **Jarvis**. There is no CLI — all operations
happen through the `linear-server` MCP tools, which provide programmatic access to create, read,
update, and comment on issues.

## Mental Model

Linear is the single source of truth for feature requests, bugs, and technical specs. Each issue
gets a unique identifier (`JAR-<n>`), workflow status, labels, and relationships (parent, blocked-by).
Unlike GitHub PRs — which hold code — Linear holds the intent and progress of work before and
after implementation.

## MCP Operations

| Operation | Tool | Purpose |
|-----------|------|---------|
| Create or update issue | `mcp__linear-server__save_issue` | Title, body, labels, status, priority, assignee |
| Read one issue | `mcp__linear-server__get_issue` | Fetch details including relations and comments |
| List / filter issues | `mcp__linear-server__list_issues` | By team, status, label, parent, priority |
| Comment on issue | `mcp__linear-server__save_comment` | Add context or resolve |
| List labels | `mcp__linear-server__list_issue_labels` | See all labels in team |
| Create label | `mcp__linear-server__save_issue_label` | Add label if missing |
| List statuses | `mcp__linear-server__list_issue_statuses` | See all workflow states |

## Conventions

**Create an issue**: Call `save_issue` with `team: "Jarvis"`, `title`, and markdown `description`.
Omit `id`.

**Update an issue**: Call `save_issue` with `id` set. It is an upsert.

**Address by identifier**: `JAR-123`. A bare number is not an identifier.

**Read an issue**: `get_issue` with `includeRelations: true`, then call `list_comments` for comments.

**Apply / remove labels**: `save_issue` with `addLabels` / `removeLabels` (by label name). Do NOT
use `labels` key — it replaces the full set.

**Missing label**: If `list_issue_labels` for team `Jarvis` doesn't show a label a skill needs,
create it first with `save_issue_label`.

**Close**: `save_issue` with `state: "Done"` or `"Canceled"`, after a `save_comment` explaining why.

## Workflow Statuses

The team has six statuses:

| Status | Meaning |
|--------|---------|
| **Backlog** | Not yet planned |
| **Todo** | Planned; claimable when it has `ready-for-agent` label |
| **In Progress** | Claimed by someone |
| **Done** | Work is merged |
| **Canceled** | Will not be done |
| **Duplicate** | Duplicate of another issue |

**Note**: There is no review status. Work goes In Progress → Done when merged.

**Failed agent runs**: An issue in **In Progress** with the `ready-for-human` label indicates a
failed agent run waiting for human intervention.

## Triage Labels

Five canonical label names:

| Label | Meaning |
|-------|---------|
| `needs-triage` | Untriaged; needs classification |
| `needs-info` | Awaiting information from reporter |
| `ready-for-agent` | Fully specified; ready for an AFK agent |
| `ready-for-human` | Agent tried but needs human review |
| `wontfix` | Will not be addressed |

## Pull Requests

PRs live on GitHub (`ten-li-po-ahat/Jarvis`), not in Linear.

**Branch naming**: Use `gitBranchName` from the Linear issue.

**Linking**: Put `Closes JAR-123` in the PR body so Linear links the PR to the issue.

**External PRs**: PRs from outside contributors are NOT treated as feature requests (the flag
`PRs as a request surface: no`). See GitHub PR tools instead.

## Wayfinding Operations

Used by `/wayfinder` skill to track exploratory work:

**Map**: An issue with label `wayfinder:map`, holding Notes / Decisions-so-far / Fog.

**Child ticket**: `save_issue` with `parentId` set to the map. Label: `wayfinder:<type>` (research/prototype/grilling/task).

**Blocking**: Linear's native relations. `save_issue` on child with `blockedBy: ["JAR-<n>"]`. A ticket is unblocked when all blockers are Done or Canceled.

**Frontier query**: Call `list_issues` with `parentId` set to map. Keep issues not Done/Canceled, drop any with assignee or open blocker. First in map order wins.

**Claim**: `save_issue` with `assignee: "me"` and `state: "In Progress"`. This is the session's first write.

**Resolve**: `save_comment` with answer, then `save_issue` with `state: "Done"`, then append context pointer (gist + identifier) to the map's Decisions-so-far via patch.

## When a Skill Says...

**"publish to the issue tracker"**: Create a Linear issue in team `Jarvis`.

**"fetch the relevant ticket"**: Run `get_issue` on the `JAR-` identifier with `includeRelations: true`,
and read its comments.

## Example

Closing an issue the way the conventions describe:

1. `save_comment` on `JAR-123` explaining why.
2. `save_issue` with `id: "JAR-123"` and `state: "Done"` (or `"Canceled"`).

To add a label without wiping the others, pass `addLabels: ["needs-triage"]`, never `labels`, which replaces the whole set.

## Related Concepts

- [[jarvis]] — Project overview
- [[bounded-contexts]] — How domain docs organize issues by context

## Sources

- [[raw/jarvis/docs/agents/issue-tracker.md]]

All MCP operations and conventions are read directly from the source. Wayfinding patterns are
inferred from the documented operations and described here because they are important for how
exploratory agents work.
