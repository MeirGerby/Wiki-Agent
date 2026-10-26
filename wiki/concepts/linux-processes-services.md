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

## Guided Practice
- For each service say what it is, who runs it, which port it uses and where its log is: `systemctl status NAME`, `journalctl -u NAME --since "1 hour ago"`, `sudo ss -tulpn | grep NAME`.
- `enable` starts a service at boot; `start` only starts it now.
- Prefer SIGTERM (`kill`) to SIGKILL (`kill -9`), which skips cleanup.

## Related Concepts
- [[linux-permissions]]
- [[log-investigation]]
- [[persistence-mechanisms]]
- [[cyber-learning-path]]
- [[suspicious-connections]]
- [[mass-file-changes]]

## Sources
- [[raw/learn/cyber-linux/stage-a-linux-foundations.md]]
- [[raw/learn/cyber-linux/steps/step-04-processes-and-services.md]]
