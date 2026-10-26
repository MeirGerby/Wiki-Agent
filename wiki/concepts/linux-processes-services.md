# Linux Processes and Services

## Definition
Running programs (processes) and long-lived background programs managed by systemd (services). `journalctl` reads their logs.

## Mental Model
A process is a running instance of a program; a service is a process systemd starts, restarts and logs for you.

## Example
```bash
ps aux
systemctl list-units --type=service --state=running
journalctl -u ssh --since "1 hour ago"
kill PID        # polite; kill -9 skips cleanup
```

## Related Concepts
- [[linux-permissions]]
- [[log-investigation]]
- [[persistence-mechanisms]]
- [[cyber-learning-path]]

## Sources
- [[raw/learn/cyber-linux/stage-a-linux-foundations.md]]
