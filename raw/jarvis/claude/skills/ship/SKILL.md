---
name: ship
description: 'Implement a piece of work from a spec or tickets, then drive it to green CI.'
disable-model-invocation: true
---

Implement the work described by the user in the spec or tickets.

Use /tdd where possible, at pre-agreed seams.

Run typechecking regularly, single test files regularly, and the full test suite once at the end.

Commit your work to the current branch and push it.

Once pushed, use /nx:monitor-ci to drive the branch to green.
