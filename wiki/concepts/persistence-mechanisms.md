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

## Related Concepts
- [[linux-processes-services]]
- [[incident-response]]
- [[system-hardening]]
- [[ssh-keys-and-agent]]
- [[cyber-learning-path]]

## Sources
- [[raw/learn/cyber-linux/stage-c-linux-security.md]]
