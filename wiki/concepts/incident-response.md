# Incident Detection and Response

## Definition
The order of work when something suspicious happens: preserve, collect, build a timeline, hash files, contain and fix, report.

## Mental Model
Do not clean up before you copy the evidence. A timeline of events plus file hashes turns "something is odd" into findings you can defend.

## Example
```bash
sha256sum /usr/bin/ssh
sudo journalctl --since "2026-10-25 20:00" --until "2026-10-25 23:00"
sudo find / -xdev -newermt "2026-10-01" -type f 2>/dev/null | head
```

## Guided Practice
- Simulate in the lab: a few wrong passwords from the attacker VM, then a correct login.
- Preserve first (copy logs, `last -a`, `ps aux`, `ss -tulpn`, with `sha256sum`), then collect, build a UTC timeline, check persistence and privileges, contain, report.
- State unknowns as unknown; a forgotten password is also a possible cause.

## Advanced Scenario
Scenario 1 and 9 feed this workflow: see [[security-scenarios]] for the full set. Habits: work in UTC, write the timeline as you go, prefer containment you can undo (lock, block, snapshot) over deletion.

## Related Concepts
- [[log-investigation]]
- [[persistence-mechanisms]]
- [[security-assessment-report]]
- [[cyber-learning-path]]
- [[security-scenarios]]
- [[suspicious-connections]]
- [[rogue-accounts]]
- [[file-integrity]]
- [[mass-file-changes]]
- [[lateral-movement-review]]

## Sources
- [[raw/learn/cyber-linux/stage-d-security-practice.md]]
- [[raw/learn/cyber-linux/steps/step-19-incident-response.md]]
- [[raw/linux/cyber-scenarios.md]]
