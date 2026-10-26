# Step 13 (שלב 13) — System Hardening

Stage C. Goal: write and run a security checklist for an Ubuntu lab machine.

## Learn

- Patching: `apt update && apt upgrade`, `unattended-upgrades`.
- Attack surface: every enabled service, open port, and user account.
- Configuration baselines: CIS Benchmarks, Lynis audit.
- Key files: `/etc/ssh/sshd_config`, `/etc/sudoers` (edit with `visudo`), `/etc/shadow`, `/etc/login.defs`.

## Guided exercise

Turn each item into a check command and an expected result:

| Check | Command | Good result |
| --- | --- | --- |
| Pending updates | `apt list --upgradable` | empty |
| Auto security updates | `systemctl status unattended-upgrades` | active |
| Listening ports | `ss -tulpn` | only needed services |
| Enabled services | `systemctl list-unit-files --state=enabled` | no unneeded entries |
| SSH root login | `sudo sshd -T \| grep permitrootlogin` | `no` |
| SSH passwords | `sudo sshd -T \| grep passwordauthentication` | `no` |
| Empty passwords | `sudo awk -F: '$2==""' /etc/shadow` | no output |
| Sudo members | `getent group sudo` | only expected users |
| Firewall | `sudo ufw status` | active, default deny |
| Shadow permissions | `ls -l /etc/shadow` | not world-readable |

1. Run every check and record pass/fail.
2. Fix the failures one at a time, rerunning the check after each fix.
3. Run `sudo lynis audit system` and compare its warnings with your list.

## What good looks like

- Each fix is tied to a check you can rerun.
- You can justify each setting, not just copy it.

## Pitfalls

- Hardening changes can break services; test one change at a time and snapshot first (step 16).
- Lynis scores are guidance, not proof of security.

## Daily summary prompts

Paste the checklist with pass/fail and what you changed.

## Review questions

1. Why remove unused services instead of just firewalling them?
2. Why edit sudoers with `visudo`?
3. What does a snapshot let you do before hardening?
