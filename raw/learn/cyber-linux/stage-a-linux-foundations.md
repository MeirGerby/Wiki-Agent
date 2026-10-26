# Stage A (שלב א׳) — Linux Foundations

Steps 1-5 of the Linux cyber learning path (`raw/learn/מסלול לימוד סייבר בלינוקס — 20 צעדים`). Goal: be comfortable in a shell before touching networks or security.

Study only on systems you own or have explicit permission to test.

## 1. Navigating the filesystem

```bash
pwd                         # where am I
ls -la                      # list with hidden files, permissions, owners
cd /etc && cd -             # go to /etc, then back
tree -L 2 /etc              # directory tree, 2 levels
find /etc -name "*.conf" 2>/dev/null     # step 1 exercise (2>/dev/null hides permission errors)
find / -mtime -1 -type f 2>/dev/null     # files changed in the last day
```

Key directories: `/etc` config, `/var/log` logs, `/home` users, `/tmp` temp, `/usr/bin` programs, `/proc` live kernel and process info.

## 2. Files and text

```bash
cat file; less file; head -n 20 file; tail -f /var/log/syslog
grep -i "error" file                     # case-insensitive search
grep -rn "password" /etc 2>/dev/null     # recursive, with line numbers
sort file | uniq -c | sort -rn | head    # count and rank repeated lines
awk '{print $1}' access.log | sort | uniq -c | sort -rn | head   # top first fields
sed 's/old/new/g' file
```

Exercise: search a log for suspicious words (`failed`, `denied`, `invalid`), then rank source IPs by count.

Related wiki pages: [[wiki/commands/grep]], [[wiki/commands/sed]], [[wiki/commands/awk]], [[wiki/concepts/pipes]].

## 3. Users and permissions

```bash
id; whoami; groups
sudo -l                      # what may I run as root
ls -l file                   # -rwxr-x--- : owner, group, others
chmod 640 file               # rw- r-- ---
chown user:group file
cat /etc/passwd              # users (no passwords here)
sudo cat /etc/shadow         # password hashes, root only
```

Permission bits: `r=4 w=2 x=1`, three groups (owner, group, others). A directory needs `x` to enter it.

Exercise: explain why one user can read a file but not edit it. Check owner, group, mode, and the user's groups.

## 4. Processes and services

```bash
ps aux; ps -ef --forest      # all processes
top; htop
kill PID; kill -9 PID        # polite stop, forced stop
systemctl status ssh
systemctl list-units --type=service --state=running
journalctl -u ssh --since "1 hour ago"
journalctl -p err -b         # errors since boot
```

Exercise: list running services and read the log of one of them.

## 5. Bash scripting

```bash
#!/usr/bin/env bash
set -euo pipefail
LOG=${1:-/var/log/auth.log}
grep "Failed password" "$LOG" \
  | awk '{print $(NF-3)}' \
  | sort | uniq -c | sort -rn | head
```

Learn: variables, `if`, `for`/`while`, exit codes (`$?`), quoting, `|`, `>`, `>>`, `2>&1`.
Exercise (step 5): print failed login attempts from a sample log, with a count per source IP. Use a sample file, not a production log.

## Self-check questions

1. What does `2>/dev/null` do, and when is it hiding something useful?
2. A file is `-rw-r-----  root  adm`. Who can read it?
3. Why does `kill -9` skip cleanup, and when is it still the right choice?
4. What does `set -euo pipefail` change in a script?

## Gotchas

- Quote variables (`"$file"`) or filenames with spaces break scripts.
- `rm -rf` and `chmod -R` have no undo. Test with `echo` or `ls` first.
- Log paths differ: Debian/Ubuntu use `/var/log/auth.log`, RHEL uses `/var/log/secure`.
