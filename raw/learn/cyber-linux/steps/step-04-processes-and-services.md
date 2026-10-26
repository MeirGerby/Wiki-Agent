# Step 4 (שלב 4) — Processes and Services

Stage A. Goal: identify running services and read their logs.

## Learn

- Process: a running program with a PID, an owner and a parent. `ps aux`, `ps -ef --forest`, `top`, `htop`, `pstree`.
- Signals: `kill PID` (SIGTERM, polite), `kill -9 PID` (SIGKILL, no cleanup), `kill -HUP` (reload for many daemons).
- Service: a process managed by systemd. `systemctl status|start|stop|restart|enable|disable NAME`.
- Logs: `journalctl -u NAME`, `--since`, `-f` (follow), `-p err`, `-b`.
- Listening ports link back to processes: `ss -tulpn`.

## Guided exercise

1. List running services: `systemctl list-units --type=service --state=running`.
2. Pick one (for example `ssh` or `cron`) and run `systemctl status NAME`. Note: PID, state, start time, last log lines.
3. Read its logs: `journalctl -u NAME --since "1 hour ago"`.
4. Link service to port: `sudo ss -tulpn | grep NAME`.
5. Start a throwaway process and stop it:
   ```bash
   sleep 600 &
   ps aux | grep "[s]leep 600"
   kill %1
   ```
6. Compare `kill` with `kill -9` on a test process, and say when SIGKILL is the right choice.

## What good looks like

- For each service you can say what it is, who runs it, which port it uses and where its log is.
- You can tell a failed service from a stopped one.

## Pitfalls

- `kill -9` skips cleanup (open files, temp files, locks).
- `enable` makes a service start at boot; `start` only starts it now.
- Many unit names differ by distribution (`ssh` vs `sshd`).

## Daily summary prompts

Write a one-line profile for three services: name, purpose, port, log command.

## Review questions

1. What is the difference between `systemctl start` and `enable`?
2. Which command shows only error-level log lines for this boot?
3. Why is SIGTERM preferred over SIGKILL?
