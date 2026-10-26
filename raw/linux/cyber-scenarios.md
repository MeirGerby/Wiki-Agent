# Cyber-Linux Advanced Scenarios

Defensive, lab-based scenarios that combine the commands in `raw/linux/cyber-commands.md`. Each scenario has a situation, an investigation path, what to look for, and the response. Run them only on machines you own or in your isolated lab (see step 16). Simulate the event in the lab first, then investigate it.

Paths use Debian/Ubuntu; use `/var/log/secure` on RHEL.

## Scenario 1 — SSH brute force, then a successful login

**Situation:** many failed logins, then a success from the same address.

```bash
sudo awk '/Failed password/ {print $(NF-3)}' /var/log/auth.log | sort | uniq -c | sort -rn | head
sudo grep -E "Failed|Accepted" /var/log/auth.log | grep 10.0.0.5
last -a | head; who; w
```

**Look for:** a burst from one IP, many usernames (`Invalid user`), then `Accepted` for one of them.
**If the success is real:** treat the account as compromised.

1. Preserve: `sudo cp -a /var/log/auth.log* ~/evidence/`, `sha256sum` them.
2. Contain: `sudo passwd -l user`, `sudo pkill -u user`, `sudo ufw deny from 10.0.0.5`.
3. Check persistence and privileges for that user (scenarios 2 and 3).
4. Fix: key-only SSH (`PasswordAuthentication no`), `PermitRootLogin no`, consider rate limiting (`ufw limit 22/tcp`) or fail2ban.

## Scenario 2 — Persistence hunt after a suspicious login

**Situation:** you must find what a session left behind.

```bash
sudo ls -la /var/spool/cron/crontabs /etc/cron.*
systemctl list-timers; systemctl list-unit-files --state=enabled
sudo find /etc/systemd /home -name "*.service" -newermt "2026-10-25" 2>/dev/null
cat /home/*/.ssh/authorized_keys /root/.ssh/authorized_keys 2>/dev/null
sudo find / -xdev -newermt "2026-10-25" -type f -not -path "/proc/*" 2>/dev/null | head -50
```

**Look for:** unknown cron lines, a new `.service` or timer, an extra SSH key, modified `.bashrc`, files in `/tmp`, `/dev/shm`, `/var/tmp`.
**Compare:** `diff -r baseline/ now/` if you recorded a baseline (step 14).
**Response:** record each entry (path, owner, time), copy it as evidence, then disable and remove; rotate any key that was added.

## Scenario 3 — Privilege-escalation surface audit

**Situation:** a normal user account was compromised. What could it turn into root?

```bash
sudo -l -U user
find / -xdev \( -perm -4000 -o -perm -2000 \) -type f 2>/dev/null
getcap -r / 2>/dev/null
find / -xdev -type f -perm -o+w 2>/dev/null | grep -v "^/proc"
getent group sudo docker adm
```

**Look for:** SUID files outside the standard list, writable SUID files, `NOPASSWD` or wildcard sudo rules, sudo rights on editors/interpreters/`find`, users in `docker`, scripts run by root from writable locations (cron jobs calling files a user can edit).
**Fix:** remove SUID (`chmod u-s`), tighten sudoers with `visudo`, remove users from `docker`, make root-run scripts root-owned and non-writable. Defensive goal only.

## Scenario 4 — Unexpected listening service or outbound connection

**Situation:** a port is open that nobody installed, or the host talks to an unknown address.

```bash
sudo ss -tulpn
sudo ss -tnp state established
sudo lsof -i -P -n | grep -v "127.0.0.1"
ps -fp PID; ls -l /proc/PID/exe; cat /proc/PID/cmdline | tr '\0' ' '
sha256sum /proc/PID/exe
```

**Look for:** a listener on `0.0.0.0` you cannot explain, a process whose binary is in `/tmp` or was deleted (`(deleted)` in `/proc/PID/exe`), connections to unusual ports.
**Capture briefly:** `sudo tcpdump -i any -n host 203.0.113.9 -w conn.pcap -c 200`.
**Response:** copy evidence first, block with `ufw deny out to 203.0.113.9`, stop the service, trace how it started (systemd unit, cron, user login).

## Scenario 5 — Web server log shows probing

**Situation:** the lab web app (Juice Shop or Nginx) receives odd requests.

```bash
awk '{print $1}' access.log | sort | uniq -c | sort -rn | head
grep -Ei "union select|' or 1=1|<script|\.\./\.\./" access.log | head
awk '$9 ~ /^(401|403|404)$/ {print $1,$9}' access.log | sort | uniq -c | sort -rn | head
awk '{print $9}' access.log | sort | uniq -c | sort -rn
```

**Look for:** one IP with many 404s (directory guessing), SQL or script fragments in the URL, repeated login 401s, path traversal (`../`).
**Response:** block the source, confirm the app uses parameterised queries and output encoding, add rate limiting, and review whether any probe returned 200 with unexpected content.

## Scenario 6 — Rogue user or hidden account

```bash
awk -F: '$3 == 0 {print $1}' /etc/passwd            # every UID 0 account
awk -F: '$3 >= 1000 {print $1,$3,$6,$7}' /etc/passwd
sudo awk -F: '$2 == "" || $2 == "!" {print $1,$2}' /etc/shadow
lastlog | grep -v "Never"
getent group sudo
sudo find /home -maxdepth 2 -name authorized_keys -exec ls -l {} \;
```

**Look for:** a second UID 0 account, a recently added user, a user with a shell that normally has none, an account with a login and no known owner.
**Response:** lock (`usermod -L`), record, then remove only after you have the evidence.

## Scenario 7 — Detecting modified system files

```bash
sudo dpkg -V                                   # Debian: package file changes
sudo debsums -c 2>/dev/null                    # if installed
sha256sum /usr/bin/ssh /usr/bin/sudo /bin/ls
sudo find /usr/bin /usr/sbin /bin /sbin -xdev -mtime -3 -type f 2>/dev/null
```

**Look for:** binaries changed outside a package update. Compare hashes with a known-good machine or a package from the same version.
**Prevention:** record hashes of key binaries right after install (`sha256sum ... > baseline/hashes.txt`) and verify with `sha256sum -c`. Tools such as AIDE do this at scale.

## Scenario 8 — Sudden mass file changes

**Situation:** many files changed in a short time (bad script, runaway process or ransomware-like behaviour).

```bash
sudo find /home /srv -xdev -type f -mmin -10 2>/dev/null | wc -l
sudo find /home /srv -xdev -type f -mmin -10 2>/dev/null | sed 's/.*\.//' | sort | uniq -c | sort -rn | head
ps aux --sort=-%cpu | head
sudo lsof +D /home 2>/dev/null | awk '{print $1,$2}' | sort | uniq -c | sort -rn | head
```

**Look for:** a new extension appearing on many files, one process doing most of the writes.
**Response:** stop the process (`kill`, then `kill -9` only if needed), disconnect the host from the network, keep the evidence, restore from backup or a snapshot. A snapshot taken before the incident is the fastest recovery.

## Scenario 9 — Lateral movement review with SSH

**Situation:** you suspect a compromised host was used to reach others.

```bash
grep -E "Accepted publickey" /var/log/auth.log | awk '{print $9,$11}' | sort | uniq -c
ls -l ~/.ssh/known_hosts; cat ~/.ssh/config
ss -tnp | grep ":22"
ps aux | grep -E "ssh .* -[LRD]" | grep -v grep          # tunnels
grep -R "ForwardAgent" ~/.ssh/config /etc/ssh/ 2>/dev/null
```

**Look for:** logins from unusual internal addresses, `ssh -L/-R/-D` processes you did not start, agent forwarding to hosts that should not have it.
**Response:** rotate keys that may have been exposed, remove unknown entries from `authorized_keys`, use `ProxyJump` instead of `ForwardAgent`, and restrict SSH sources with `ufw`.

## Scenario 10 — Full assessment of a lab machine (capstone drill)

Combine everything into one repeatable run and keep each output in an `evidence/` folder.

```bash
mkdir -p evidence && cd evidence
nmap -sV -p- TARGET -oN nmap.txt                          # from the attacker VM
sudo ss -tulpn > ss.txt
sudo awk '/Failed password/ {print $(NF-3)}' /var/log/auth.log | sort | uniq -c | sort -rn > failed-ips.txt
find / -xdev \( -perm -4000 -o -perm -2000 \) -type f 2>/dev/null > suid.txt
getcap -r / 2>/dev/null > caps.txt
sudo sshd -T | grep -Ei "permitrootlogin|passwordauthentication" > sshd.txt
sudo ufw status verbose > ufw.txt
systemctl list-unit-files --state=enabled > units.txt
sha256sum * > SHA256SUMS
```

Then write the report from the template in step 20: scope and authorization, findings table (risk, evidence, fix), remediation plan, retest after fixes. Every finding must point at a file in `evidence/`.

## Habits that apply to every scenario

- Preserve evidence before cleanup; hash it.
- Work in UTC, and write the timeline as you go.
- Change one thing at a time; keep a second session open for SSH and firewall changes.
- Prefer containment you can undo (lock, block, snapshot) over deletion.
- State what you do not know; "unknown" is a valid finding.
