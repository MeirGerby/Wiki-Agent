# Stage C (שלב ג׳) — Linux Security

Steps 11-15 of the Linux cyber learning path. Goal: investigate logs, restrict access, and find weak spots on a system you own.

## 11. Log investigation

```bash
ls /var/log
sudo grep "Failed password" /var/log/auth.log | tail
sudo journalctl -u ssh --since today | grep -i "invalid\|failed"
last -a | head              # successful logins
sudo lastb | head           # failed logins (root)
sudo awk '/Failed password/ {print $(NF-3)}' /var/log/auth.log | sort | uniq -c | sort -rn | head
```

Exercise (step 11): list failed logins, then separate noise (one typo) from a pattern (many attempts, many usernames, one source IP in a short time).

## 12. Firewall

```bash
sudo ufw status verbose
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow from 192.168.56.0/24 to any port 22 proto tcp
sudo ufw enable
sudo nft list ruleset        # nftables, the lower layer
```

Principle: **least privilege**. Deny by default, allow only what is needed. Exercise: allow your lab service on its one port only, and verify with a scan from another lab machine.

Keep a second session open when changing SSH rules, so you do not lock yourself out.

## 13. System hardening

Checklist for an Ubuntu lab machine (exercise 13):

- [ ] Updates applied: `sudo apt update && sudo apt upgrade`
- [ ] Unattended security updates on
- [ ] Unused services stopped: `systemctl list-unit-files --state=enabled`
- [ ] Listening ports reviewed: `ss -tulpn`
- [ ] SSH: no root login, key auth, no password auth
- [ ] No users with empty passwords: `sudo awk -F: '$2==""' /etc/shadow`
- [ ] Sudo access reviewed: `getent group sudo`
- [ ] Firewall on, default deny incoming
- [ ] File permissions on `/etc/shadow`, SSH keys and config files checked
- [ ] Logs retained and readable

Tools to compare against a baseline: Lynis (`sudo lynis audit system`), CIS Benchmarks.

## 14. Persistence mechanisms (what to look for)

Where something can hide to survive a reboot, and how to check each place:

```bash
crontab -l; sudo ls /etc/cron.* /var/spool/cron/crontabs
systemctl list-unit-files --state=enabled
systemctl list-timers
ls -la /etc/systemd/system ~/.config/systemd/user 2>/dev/null
cat ~/.ssh/authorized_keys             # unexpected keys
tail ~/.bashrc ~/.profile              # added commands
ls -la /etc/rc.local /etc/init.d 2>/dev/null
```

Exercise: in a lab machine, review scheduled tasks and services, then explain each one you do not recognise. Unknown does not mean malicious, but it deserves an explanation.

## 15. Advanced permissions and local weaknesses

```bash
find / -perm -4000 -type f 2>/dev/null     # SUID: runs as the file's owner
find / -perm -2000 -type f 2>/dev/null     # SGID
getcap -r / 2>/dev/null                    # Linux capabilities
sudo -l                                    # what this user may run
find / -xdev -type f -perm -o+w 2>/dev/null    # world-writable files
```

- **SUID**: the program runs with the owner's rights (often root). A flaw in it, or a way to make it run arbitrary commands, becomes a privilege escalation.
- **Capabilities**: split root's power into pieces (e.g. `cap_net_bind_service`).
- **Sudo rules**: a rule allowing an editor, interpreter or `find` can often be turned into a root shell. Review `sudoers` for these.

Exercise (step 15): list unusual SUID files and sudo rules, and write one sentence each on why it is a risk and how to fix it. Defensive goal: find and remove, not exploit.

## Self-check questions

1. What separates one failed login from a brute-force attempt in the logs?
2. Why deny by default instead of blocking known bad ports?
3. Name four places a program can persist across reboot.
4. Why is a SUID copy of `/bin/bash` dangerous?
