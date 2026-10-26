# Step 20 (שלב 20) — Capstone: Security Assessment of Your Own Machine

Stage D. Goal: a full assessment of one machine you own, with a written report.

Deliverable: a Markdown report with findings, risk level, evidence and remediation steps.

## Scope and authorization

Write this first, at the top of the report:

- Target (hostname, address, OS), owner (you), date.
- In scope: the target VM from step 16. Out of scope: everything else.
- Authorization: you own it.

## Method

1. **Map services**
   - `nmap -sV -p- TARGET -oN nmap.txt` from the attacker VM.
   - `ss -tulpn` on the target. They should agree; explain any difference.
2. **Check permissions**
   - SUID/SGID, capabilities, sudo rules, world-writable files (step 15).
   - SSH configuration and `authorized_keys` (step 10).
3. **Analyse logs**
   - Failed and successful logins, odd times, new accounts (step 11).
4. **Check hardening and persistence**
   - Run your checklist from step 13 and the baseline diff from step 14.
5. **Recommend fixes**
   - One concrete fix per finding, ordered by risk.

## Risk rating

Risk = impact x likelihood, rated High / Medium / Low, with one sentence of reasoning.

## Report template

```markdown
# Security Assessment: <machine>
Date: ... | Scope: ... | Authorization: owner = me

## Summary
Two or three sentences: overall state, number of findings by risk.

## Findings
| # | Finding | Risk | Evidence | Fix |
|---|---------|------|----------|-----|
| 1 | | High | `command` output / log line | |

## Evidence
Commands run and their output (trimmed), with file names for full output.

## Remediation plan
1. Fix highest risk first, with the exact command or setting.

## Retest
Commands rerun after fixes and the new results.
```

## What good looks like

- Every finding has evidence you can reproduce.
- The report includes a retest after fixing.
- Another person could follow the fixes without asking you.

## Pitfalls

- Opinions without evidence ("seems insecure").
- Fixing before documenting the original state.
- Rating everything High; the ranking is the value.

## Final self-check

1. Can you explain every open port?
2. Can you show the log line behind each logging finding?
3. Did the retest confirm each fix?
4. Which finding would you fix first, and why?
