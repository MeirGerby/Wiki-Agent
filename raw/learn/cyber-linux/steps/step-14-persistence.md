# Step 14 (שלב 14) — Persistence Mechanisms

Stage C. Goal: learn where a program can arrange to run again after reboot, so you can find unexpected entries on a lab machine.

This is a defender's checklist: review and explain, do not hide anything.

## Learn

| Place | What runs | How to list |
| --- | --- | --- |
| cron | scheduled commands | `crontab -l`, `/etc/cron.*`, `/var/spool/cron/crontabs` |
| systemd units | services at boot | `systemctl list-unit-files --state=enabled` |
| systemd timers | scheduled units | `systemctl list-timers` |
| User systemd | per-user services | `~/.config/systemd/user/` |
| SSH keys | remote login | `~/.ssh/authorized_keys` |
| Shell startup | on login or shell start | `~/.bashrc`, `~/.profile`, `/etc/profile.d/` |
| Init scripts | legacy start | `/etc/rc.local`, `/etc/init.d/` |

## Guided exercise

1. On a fresh lab VM, record a **baseline**: save the output of each command above into `baseline/`.
2. Make a harmless change: add a cron line `@reboot echo hello >> /tmp/hello.txt` and a user timer.
3. Re-run the commands and diff against the baseline: `diff -r baseline/ now/`.
4. For each difference, write: what is it, who added it, why, and whether it is expected.
5. Remove your test entries and confirm the diff is clean.

## What good looks like

- You find your own change by comparing, not by guessing.
- Every unexplained entry gets an owner and a reason, or goes on the review list.

## Pitfalls

- "Unknown" is not "malicious"; vendor packages add many units.
- Checking only root's crontab misses other users' tasks.
- Without a baseline you cannot tell new from normal.

## Daily summary prompts

Which three places would you check first after a suspicious login, and why?

## Review questions

1. Name four places a task can persist across reboot.
2. Why take a baseline before an incident?
3. Which file would show an attacker's added SSH key?
