# Mass File Changes

## Definition
Responding when many files change in a short time: a bad script, a runaway process, or ransomware-like behaviour.

## Mental Model
Two questions: what changed (a new extension on many files?) and which process is doing the writing. Contain first by stopping that process and cutting the network, then restore from a clean backup or snapshot.

## Example
```bash
sudo find /home /srv -xdev -type f -mmin -10 2>/dev/null | wc -l
sudo find /home /srv -xdev -type f -mmin -10 2>/dev/null | sed 's/.*\.//' | sort | uniq -c | sort -rn | head
ps aux --sort=-%cpu | head
```
Use `kill` first and `kill -9` only if needed. A snapshot taken before the incident is the fastest recovery.

## Related Concepts
- [[linux-processes-services]]
- [[incident-response]]
- [[cyber-lab]]
- [[file-integrity]]
- [[security-scenarios]]

## Sources
- [[raw/linux/cyber-scenarios.md]]
