---
name: to-prd
description: Turn the current conversation into a product requirements document (PRD) and publish it to the project issue tracker — no interview, just synthesis of what you've already discussed.
disable-model-invocation: false
---

This skill takes the current conversation context and produces a PRD. Do NOT interview the user — just synthesize what you already know, entirely from the user's and the product's perspective. Leave every technical concern out.

The issue tracker and triage label vocabulary should have been provided to you — run `/setup-matt-pocock-skills` if not.

## Process

1. Write the PRD using the template below. Frame every section from the user's perspective — the problem they hit, the outcome they want. Use the project's domain glossary vocabulary throughout.

2. Validate the final prd with the user.

3. Publish it to the project issue tracker.

<prd-template>

## Problem Statement

The problem that the user is facing, from the user's perspective.

## Solution

The solution to the problem, from the user's perspective.

## Definition of Done

A list of behaviors that need to be accomplished for the feature to be considered complete.

## Out of Scope

A description of the things that are out of scope for this PRD.

</prd-template>
