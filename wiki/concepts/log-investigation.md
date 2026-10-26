# Log Investigation

## Definition
Reading system logs (`/var/log`, `journalctl`) to separate normal activity from suspicious patterns, such as repeated failed logins.

## Mental Model
One failed login is noise; many attempts, many usernames and one source IP in a short time is a pattern. Count and rank with `grep | awk | sort | uniq -c | sort -rn`.

## Example
```bash
sudo grep "Failed password" /var/log/auth.log | tail
sudo awk '/Failed password/ {print $(NF-3)}' /var/log/auth.log | sort | uniq -c | sort -rn | head
last -a | head
```
Log paths differ: Debian/Ubuntu use `/var/log/auth.log`, RHEL uses `/var/log/secure`.

## Guided Practice
- Count failures per source IP and per username tried, then check whether a success follows a burst from the same IP.
- Classify: noise (1-2 failures, known user), pattern (many failures, many usernames, one IP, short window), concern (success right after a burst).
- Field positions in `awk` differ with the log format; rotated logs are in `auth.log.1` or `.gz` (`zgrep`).

## Advanced Scenario
Scenario 1, SSH brute force then success:
```bash
sudo grep -E "Failed|Accepted" /var/log/auth.log | grep 10.0.0.5
last -a | head; who; w
```
If the success is real, treat the account as compromised: preserve logs and hash them, contain (`passwd -l user`, `pkill -u user`, `ufw deny from 10.0.0.5`), check persistence and privileges for that user, then move to key-only SSH, `PermitRootLogin no`, and `ufw limit 22/tcp` or fail2ban.

## Related Concepts
- [[grep]]
- [[awk]]
- [[sed]]
- [[pipes]]
- [[incident-response]]
- [[linux-processes-services]]
- [[cyber-learning-path]]
- [[bash-scripting]]
- [[security-scenarios]]
- [[web-log-analysis]]
- [[rogue-accounts]]
- [[lateral-movement-review]]

## Sources
- [[raw/learn/cyber-linux/stage-a-linux-foundations.md]]
- [[raw/learn/cyber-linux/stage-c-linux-security.md]]
- [[raw/learn/cyber-linux/steps/step-11-log-investigation.md]]
- [[raw/linux/cyber-scenarios.md]]
