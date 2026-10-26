# Cyber-Linux Command Reference

## Definition
A grouped index of every command used in the Linux cyber learning path, pointing to the page that explains each group.

## Mental Model
Look up by question, not by tool name: "what is listening?" leads to `ss`; "who logged in?" to `last`/`lastb`. The full table with flags is in the source file.

## Example
| Group | Key commands | Page |
| --- | --- | --- |
| Filesystem | `ls`, `cd`, `find`, `stat`, `tree` | [[linux-filesystem-navigation]] |
| Text | `grep`, `sort`, `uniq -c`, `cut`, `sed`, `awk`, `diff` | [[grep]], [[sed]], [[awk]], [[pipes]] |
| Users and permissions | `id`, `sudo -l`, `chmod`, `chown`, `getent`, `getcap` | [[linux-permissions]] |
| Processes and services | `ps`, `top`, `kill`, `systemctl`, `journalctl`, `lsof` | [[linux-processes-services]] |
| Scripting | `set -euo pipefail`, double-bracket tests, loops | [[bash-scripting]] |
| Networking | `ip`, `ss -tulpn`, `dig`, `curl`, `nc` | [[network-fundamentals]] |
| Capture | `tcpdump -nn`, Wireshark filters | [[packet-capture]] |
| Scanning | `nmap -sV -p-`, `-sn`, `-sU` | [[network-scanning]], [[kali-tools]] |
| SSH | `ssh-keygen`, `ssh-copy-id`, `ssh -L/-J`, `sshd -T` | [[ssh-keys-and-agent]], [[ssh-tunnels]] |
| Logs and logins | `last`, `lastb`, `lastlog`, `who`, `w` | [[log-investigation]] |
| Firewall | `ufw`, `nft list ruleset` | [[linux-firewall]] |
| Hardening | `apt`, `lynis`, `/etc/shadow` checks | [[system-hardening]] |
| Persistence | `crontab`, `systemctl list-timers` | [[persistence-mechanisms]] |
| Privilege audit | `find -perm -4000`, `getcap -r /` | [[suid-and-capabilities]] |
| Lab | `VBoxManage snapshot`, `docker run` | [[cyber-lab]], [[web-security]] |
| Evidence | `sha256sum`, `dpkg -V`, `journalctl --since` | [[incident-response]], [[file-integrity]] |

Quick reminders: `2>/dev/null` hides errors; `sort` before `uniq -c`; keep a second SSH session open when changing SSH or firewall rules; snapshot before hardening; copy evidence before cleanup.

## Related Concepts
- [[cyber-learning-path]]
- [[security-scenarios]]
- [[grep]]
- [[sed]]
- [[awk]]
- [[pipes]]
- [[ssh]]
- [[linux-filesystem-navigation]]
- [[bash-scripting]]

## Sources
- [[raw/linux/cyber-commands.md]]
