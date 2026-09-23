# Issue tracker: Linear

Issues and specs for this repo live in **Linear**, team **Jarvis**. There is no CLI. Do all issue operations through the `linear-server` MCP tools.

| Operation                                                  | Tool                                      |
| ---------------------------------------------------------- | ----------------------------------------- |
| Create or update an issue (title, body, labels, status, …) | `mcp__linear-server__save_issue`          |
| Read one issue                                             | `mcp__linear-server__get_issue`           |
| List / filter issues (team, status, label, parent)         | `mcp__linear-server__list_issues`         |
| Comment on an issue                                        | `mcp__linear-server__save_comment`        |
| List labels                                                | `mcp__linear-server__list_issue_labels`   |
| Create a label                                             | `mcp__linear-server__save_issue_label`    |
| List workflow statuses                                     | `mcp__linear-server__list_issue_statuses` |

## Conventions

- **Create an issue**: `save_issue` with `team: "Jarvis"`, `title`, and a markdown `description`. Omit `id`.
- **Update an issue**: `save_issue` with `id` set to the identifier. `save_issue` is an upsert.
- **Address an issue** by its identifier, `JAR-123`. A bare number is not an identifier.
- **Read an issue**: `get_issue` with `includeRelations: true`, then `list_comments` for its comments.
- **Apply / remove labels**: `save_issue` with `addLabels` / `removeLabels`, by label name. Do not use `labels`: it replaces the full set.
- **Missing label**: if `list_issue_labels` for team `Jarvis` does not show a label a skill needs, create it with `save_issue_label` first.
- **Close**: `save_issue` with `state: "Done"` (or `"Canceled"`), after a `save_comment` that says why.

## Workflow statuses

The team has these statuses: **Backlog**, **Todo**, **In Progress**, **Done**, **Canceled**, **Duplicate**. There is no review status.

| Status          | Meaning                                                |
| --------------- | ------------------------------------------------------ |
| **Todo**        | Claimable when it also has the `ready-for-agent` label |
| **In Progress** | Claimed; somebody works on it                          |
| **Done**        | Work is merged                                         |

An issue in **In Progress** that has the `ready-for-human` label is a failed agent run that waits for a person.

## Pull requests

Pull requests live on GitHub (`ten-li-po-ahat/Jarvis`), not in Linear. Name the branch with the issue's `gitBranchName`, and put `Closes JAR-123` in the PR body, so Linear links the PR to the issue.

**PRs as a request surface: no.** _(Set to `yes` if this repo treats external PRs as feature requests; `/triage` reads this flag.)_

When set to `yes`, PRs run through the same labels and states as issues, with the `gh pr` commands:

- **Read a PR**: `gh pr view <number> --comments` and `gh pr diff <number>`.
- **List external PRs for triage**: `gh pr list --state open --json number,title,body,labels,author,authorAssociation,comments`, then keep only `authorAssociation` of `CONTRIBUTOR`, `FIRST_TIME_CONTRIBUTOR`, or `NONE`.
- **Comment / label / close**: `gh pr comment`, `gh pr edit --add-label`/`--remove-label`, `gh pr close`.

A bare `#42` is a GitHub PR. A `JAR-42` is a Linear issue.

## When a skill says "publish to the issue tracker"

Create a Linear issue in team `Jarvis`.

## When a skill says "fetch the relevant ticket"

Run `get_issue` on the `JAR-` identifier with `includeRelations: true`, and read its comments.

## Wayfinding operations

Used by `/wayfinder`. The **map** is a single issue with **child** issues as tickets.

- **Map**: an issue with the label `wayfinder:map`, holding the Notes / Decisions-so-far / Fog body.
- **Child ticket**: `save_issue` with `parentId` set to the map identifier. Label: `wayfinder:<type>` (`research`/`prototype`/`grilling`/`task`).
- **Blocking**: Linear's native relations. `save_issue` on the child with `blockedBy: ["JAR-<n>"]`. A ticket is unblocked when every blocker is **Done** or **Canceled**.
- **Frontier query**: `list_issues` with `parentId` set to the map, keep issues not **Done** / **Canceled**, drop any with an assignee or an open blocker (`get_issue` with `includeRelations: true`); first in map order wins.
- **Claim**: `save_issue` with `assignee: "me"` and `state: "In Progress"`. This is the session's first write.
- **Resolve**: `save_comment` with the answer, then `save_issue` with `state: "Done"`, then append a context pointer (gist + identifier) to the map's Decisions-so-far with a `patch` on the map.
