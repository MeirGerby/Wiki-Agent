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

## Related Concepts
- [[log-investigation]]
- [[persistence-mechanisms]]
- [[security-assessment-report]]
- [[cyber-learning-path]]

## Sources
- [[raw/learn/cyber-linux/stage-d-security-practice.md]]
