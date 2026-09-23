---
name: grill-prd
description: Run a product focused grilling session (no technical questions), then turning the grilling session output into a published PRD.
disable-model-invocation: true
---

# Context

The invoker is a product mannager, not a software engeneer so this skill is scoped to product concerns only. It will not ask any technical or implementation questions - the invoker will not be able to answer them.

# Process

## 1. Grill

Invoke `/grill-me` session, scoped to the around the **idea**.

## 2. Invoke /to-prd

Invoke `/to-prd` on the context.

# Constraints

- DO NOT ask any technical or implementation questions. The PRD is a product document, not a technical one.
