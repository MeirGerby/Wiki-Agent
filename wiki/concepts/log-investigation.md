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

## Related Concepts
- [[grep]]
- [[awk]]
- [[sed]]
- [[pipes]]
- [[incident-response]]
- [[linux-processes-services]]
- [[cyber-learning-path]]

## Sources
- [[raw/learn/cyber-linux/stage-a-linux-foundations.md]]
- [[raw/learn/cyber-linux/stage-c-linux-security.md]]
