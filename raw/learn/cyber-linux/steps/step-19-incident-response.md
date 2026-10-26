# Step 19 (שלב 19) — Security Incident Detection and Response

Stage D. Goal: investigate a simulated suspicious login and write a findings report.

## Learn

- Phases: preparation, detection, containment, eradication, recovery, lessons learned.
- Evidence handling: copy before changing, record time and commands, keep hashes.
- Timeline: one ordered list of events from all sources.
- Indicators: new accounts, new SSH keys, new scheduled tasks, unusual outbound connections, modified binaries.

## Guided exercise (simulated)

Scenario: on a lab VM, someone logged in as `deploy` after many failures from `10.0.0.5`.

1. Simulate it (lab only): from the attacker VM try a few wrong passwords, then log in correctly as a test user.
2. **Preserve**: copy `/var/log/auth.log*` and the output of `last -a`, `ps aux`, `ss -tulpn`, `crontab -l` into a folder; record `sha256sum` of each.
3. **Collect**: `who`, `w`, `last -a`, `sudo journalctl --since "1 hour ago"`.
4. **Timeline** (UTC if you can):

   | Time | Event | Source |
   | --- | --- | --- |
   | 10:01 | 12 failed logins from 10.0.0.5 | auth.log |
   | 10:03 | successful login as deploy | auth.log |
   | 10:04 | new cron entry | crontab |

5. **Check persistence** (step 14) and **privileges** (step 15) for that user.
6. **Contain**: block the source IP, disable or reset the account, rotate keys.
7. Write the report: summary, timeline, evidence, impact, actions taken, recommendations.

## What good looks like

- Evidence was copied before cleanup.
- Each claim in the report points to a log line or command output.
- Unknowns are stated as unknown.

## Pitfalls

- Rebooting or deleting files destroys volatile evidence (processes, connections).
- Mixing time zones breaks the timeline.
- Jumping to "attacked" without evidence; a forgotten password is also a cause.

## Daily summary prompts

Write the one-paragraph executive summary for a non-technical reader.

## Review questions

1. Why preserve evidence before cleaning up?
2. What does a file hash let you prove?
3. What belongs in a timeline?
