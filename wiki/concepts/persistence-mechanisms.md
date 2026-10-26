# Persistence Mechanisms

## Definition
Places where a program can arrange to survive a reboot: cron, systemd units and timers, `authorized_keys`, shell startup files, `rc.local`.

## Mental Model
For defenders it is a checklist of where to look. An unknown entry is not automatically malicious, but it needs an explanation.

## Example
```bash
crontab -l; sudo ls /etc/cron.*
systemctl list-unit-files --state=enabled; systemctl list-timers
cat ~/.ssh/authorized_keys
tail ~/.bashrc ~/.profile
```

## Guided Practice
- Record a baseline of every place (cron, enabled units, timers, `authorized_keys`, shell startup files) on a fresh VM.
- Add a harmless `@reboot` cron line, re-run, and `diff -r baseline/ now/`; then remove it and confirm the diff is clean.
- Every unexplained entry needs an owner and a reason. Checking only root's crontab misses other users' tasks.

## Advanced Scenario
Scenario 2, persistence hunt after a suspicious login:
```bash
sudo find / -xdev -newermt "2026-10-25" -type f -not -path "/proc/*" 2>/dev/null | head -50
cat /home/*/.ssh/authorized_keys /root/.ssh/authorized_keys 2>/dev/null
```
Look for unknown cron lines, a new `.service` or timer, an extra SSH key, modified `.bashrc`, and files in `/tmp`, `/dev/shm`, `/var/tmp`. Record each entry (path, owner, time), copy it as evidence, then disable and remove; rotate any key that was added.

## Related Concepts
- [[linux-processes-services]]
- [[incident-response]]
- [[system-hardening]]
- [[ssh-keys-and-agent]]
- [[cyber-learning-path]]
- [[security-scenarios]]
- [[rogue-accounts]]
- [[file-integrity]]

## Sources
- [[raw/learn/cyber-linux/stage-c-linux-security.md]]
- [[raw/learn/cyber-linux/steps/step-14-persistence.md]]
- [[raw/linux/cyber-scenarios.md]]
