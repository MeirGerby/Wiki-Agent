# Step 11 (שלב 11) — Log Investigation

Stage C. Goal: find failed logins and tell noise from a real pattern.

## Learn

- Locations: `/var/log/auth.log` (Debian/Ubuntu) or `/var/log/secure` (RHEL), `/var/log/syslog`, `journalctl`.
- `journalctl`: `-u unit`, `--since`, `--until`, `-p err`, `-b` (this boot), `-o short-iso`.
- Login records: `last`, `lastb`, `lastlog`.
- Fields to extract: time, user, source IP, result, service.

## Guided exercise

1. List failures: `sudo grep "Failed password" /var/log/auth.log | tail -20`.
2. Count per source IP:
   `sudo awk '/Failed password/ {print $(NF-3)}' /var/log/auth.log | sort | uniq -c | sort -rn | head`
3. Count per username tried:
   `sudo grep "Failed password" /var/log/auth.log | awk '{print $9}' | sort | uniq -c | sort -rn | head`
4. Find successes after failures from the same IP: `sudo grep -E "Failed|Accepted" /var/log/auth.log | grep 10.0.0.5`.
5. Classify and write down:
   - **Noise**: 1-2 failures, a known user, a known IP.
   - **Pattern**: many failures, many usernames, one IP, short time window.
   - **Concern**: a success right after a burst of failures.

## What good looks like

- You can answer: who, from where, when, how many, and did it succeed?
- You keep the exact commands and output as evidence.

## Pitfalls

- Field positions in awk differ with the log format (`Invalid user` lines have extra words).
- Log rotation: older entries are in `auth.log.1` or `.gz` (`zgrep`).
- Timestamps use local time without a year; note the timezone.

## Daily summary prompts

Write a three-line finding: what you saw, what it likely means, what you would do.

## Review questions

1. Which log shows failed SSH logins on your system?
2. What makes a burst of failures suspicious?
3. How do you read a rotated, compressed log?
