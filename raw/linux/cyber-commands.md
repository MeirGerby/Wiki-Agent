# Cyber-Linux Command Reference

Every command used in the Linux cyber learning path (`raw/learn/cyber-linux/`), grouped by topic, with the flags that matter. Use them on systems you own or have explicit permission to test.

Related: `raw/linux/grep.md`, `sed.md`, `awk.md`, `pipes.md`, `ssh-config.md`, `git.md`. Advanced scenarios: `raw/linux/cyber-scenarios.md`.

## 1. Filesystem and files (stage A, steps 1-2)

| Command | Use | Key flags and examples |
| --- | --- | --- |
| `pwd` | current directory | |
| `ls` | list | `-l` long, `-a` hidden, `-h` sizes, `-t` by time, `-R` recursive |
| `cd` | change directory | `cd -` previous, `cd ~` home, `cd ..` parent |
| `tree` | directory tree | `-L 2` depth, `-a` hidden, `-d` dirs only |
| `find` | search by attributes | `-name "*.conf"`, `-iname`, `-type f/d`, `-mtime -1`, `-size +50M`, `-perm -4000`, `-user bob`, `-newermt "2026-10-01"`, `-xdev`, `-exec cmd {} \;` |
| `stat` | file metadata | owner, mode, size, atime/mtime/ctime |
| `file` | detect file type | `file /bin/ls` |
| `cat` / `less` | view | `less +F` follow, `/text` search inside less |
| `head` / `tail` | start / end | `-n 20`, `tail -f` follow |
| `wc` | count | `-l` lines, `-w` words, `-c` bytes |
| `cp` `mv` `rm` `mkdir` `touch` | manage files | `cp -a` preserve, `rm -r` recursive (no undo), `mkdir -p` |
| `ln` | links | `ln -s target link` |
| `du` / `df` | space | `du -sh *`, `df -h` |

```bash
find /etc -name "*.conf" 2>/dev/null | wc -l
find / -xdev -type f -size +100M 2>/dev/null
find /var/log -name "*.log" -mtime -1 -exec ls -l {} \;
```

## 2. Text processing (step 2)

| Command | Use | Examples |
| --- | --- | --- |
| `grep` | search | `-i`, `-n`, `-r`, `-v`, `-c`, `-E "a\|b"`, `-A 3 -B 3` context, `-o` only match |
| `zgrep` | grep compressed logs | `zgrep "Failed" /var/log/auth.log.*.gz` |
| `sort` | order | `-n` numeric, `-r` reverse, `-u` unique, `-k2` by field |
| `uniq` | dedupe adjacent | `-c` count, `-d` only duplicates |
| `cut` | pick columns | `cut -d' ' -f1` |
| `tr` | translate chars | `tr -d '\r'`, `tr a-z A-Z` |
| `sed` | edit stream | `s/old/new/g`, `-n '5,10p'`, `-i` in place, `-E` regex |
| `awk` | fields and logic | `'{print $1}'`, `-F:`, `'$3 > 100'`, `'/Failed/ {c[$NF]++} END {for (k in c) print c[k],k}'` |
| `diff` | compare | `diff -r dir1 dir2`, `-u` unified |
| `tee` | write and pass on | `cmd \| tee out.txt` |
| `xargs` | build commands from input | `\| xargs -n1 cmd` |

```bash
awk '{print $1}' access.log | sort | uniq -c | sort -rn | head
sed -E 's/\.[0-9]+ / .x /' access.log
```

Redirection: `>` overwrite, `>>` append, `<` input, `2>` stderr, `2>&1` both, `&>` both (bash), `<<'EOF'` here-document.

## 3. Users, groups, permissions (step 3, step 15)

| Command | Use | Examples |
| --- | --- | --- |
| `id`, `whoami`, `groups` | who am I | `id bob` |
| `sudo` | run as another user | `sudo -l` allowed commands, `sudo -u tester cmd`, `sudo -i` root shell |
| `su` | switch user | `su - tester` |
| `chmod` | change mode | `640`, `u+x`, `g-w`, `-R`, special: `chmod 4750` (SUID), `chmod +t dir` |
| `chown` / `chgrp` | change owner/group | `chown user:group file`, `-R` |
| `useradd` / `usermod` / `userdel` | accounts | `useradd -m tester`, `usermod -aG group tester` |
| `passwd` | set password | `passwd -l user` lock |
| `getent` | query account databases | `getent group sudo`, `getent passwd bob` |
| `visudo` | safe sudoers edit | validates syntax |
| `getcap` / `setcap` | capabilities | `getcap -r / 2>/dev/null` |
| `umask` | default mode mask | `umask 027` |

Special files: `/etc/passwd`, `/etc/shadow`, `/etc/group`, `/etc/sudoers`, `/etc/sudoers.d/`.

## 4. Processes and services (step 4)

| Command | Use | Examples |
| --- | --- | --- |
| `ps` | list processes | `ps aux`, `ps -ef --forest`, `ps -p PID -o pid,user,cmd` |
| `top` / `htop` | live view | `top -o %MEM` |
| `pstree` | process tree | `pstree -p` |
| `pgrep` / `pkill` | find/signal by name | `pgrep -a sshd` |
| `kill` | signal | `kill PID` (TERM), `kill -9 PID` (KILL), `kill -HUP PID`, `kill %1` |
| `jobs` / `bg` / `fg` | shell jobs | `sleep 600 &` |
| `systemctl` | services | `status`, `start`, `stop`, `restart`, `enable`, `disable`, `list-units --type=service --state=running`, `list-unit-files --state=enabled`, `list-timers`, `is-active` |
| `journalctl` | logs | `-u NAME`, `--since "1 hour ago"`, `--until`, `-f`, `-p err`, `-b`, `-o short-iso` |
| `lsof` | open files and ports | `sudo lsof -i :22`, `lsof -p PID` |

## 5. Bash scripting (step 5)

```bash
#!/usr/bin/env bash
set -euo pipefail                  # stop on error, unset var, pipe failure
log=${1:?usage: script LOGFILE}    # required argument
[[ -f "$log" ]] || { echo "no file" >&2; exit 1; }
for f in *.log; do echo "$f"; done
while read -r line; do echo "$line"; done < file
echo $?                            # exit code of last command
```

Quoting: always `"$var"`. Test: `[[ -f f ]]`, `-d`, `-r`, `-z`, `-n`, `==`, `-eq`.

## 6. Networking (steps 6-7)

| Command | Use | Examples |
| --- | --- | --- |
| `ip` | addresses, routes | `ip a`, `ip route`, `ip link`, `ip neigh` |
| `ss` | sockets | `ss -tulpn` listening, `ss -tn` established, `ss -s` summary |
| `ping` | reachability | `ping -c 4 host` |
| `traceroute` / `tracepath` | path | `traceroute example.com` |
| `dig` | DNS | `dig example.com A +short`, `dig @1.1.1.1 example.com MX`, `dig -x 1.2.3.4`, `+trace` |
| `curl` | HTTP | `-I` headers, `-v` verbose, `-o /dev/null`, `-L` follow, `-k` skip cert check (lab only), `-X POST -d 'a=b'` |
| `ipcalc` | CIDR maths | `ipcalc 192.168.1.77/26` |
| `cat /etc/resolv.conf` | DNS servers | |
| `nc` (netcat) | test a port | `nc -vz host 22` |

## 7. Traffic capture (step 8)

```bash
sudo tcpdump -i any -n port 53                     # DNS
sudo tcpdump -i any -n host 10.0.0.5 -w cap.pcap   # save to file
tcpdump -nn -r cap.pcap                            # read file
tcpdump -nn 'tcp[tcpflags] & tcp-syn != 0'         # SYN packets
tcpdump -nn -A port 80                             # show ASCII payload
```

Flags: `-i` interface, `-n` no DNS lookup, `-nn` also no port names, `-w` write, `-r` read, `-c N` stop after N, `-A` ASCII.
Wireshark display filters: `dns`, `http`, `tcp.flags.syn==1`, `tcp.flags.reset==1`, `ip.addr==10.0.0.5`, `tcp.stream eq 3`, `frame contains "login"`.

## 8. Scanning (step 9, 17)

```bash
nmap 127.0.0.1
nmap -sn 192.168.56.0/24              # host discovery, no port scan
nmap -sV -p 1-1000 TARGET             # versions
nmap -sV -p- TARGET -oN scan.txt      # all ports, save
nmap -sC -sV TARGET                   # default scripts
nmap -sU --top-ports 20 TARGET        # UDP
nmap -sT TARGET                       # TCP connect (no root)
nmap -Pn TARGET                       # skip ping (host blocks ICMP)
nmap -oX scan.xml TARGET              # XML output
```

States: `open`, `closed`, `filtered`, `open|filtered`. Scan only what you own or may test.

## 9. SSH (step 10)

```bash
ssh-keygen -t ed25519 -f ~/.ssh/id_lab -C "lab"
ssh-copy-id -i ~/.ssh/id_lab.pub user@host
ssh -i ~/.ssh/id_lab user@host
ssh -v user@host                          # debug; -vv, -vvv
ssh -G host                               # effective config
ssh -L 5433:localhost:5432 user@host      # local forward
ssh -J admin@bastion user@10.0.0.5        # jump host
ssh-agent / ssh-add / ssh-add -l          # key agent
ssh-keygen -lf key.pub                    # fingerprint
ssh-keygen -R host                        # drop stale host key
sudo sshd -t                              # validate server config
sudo sshd -T | grep -i permitrootlogin    # effective server setting
```

Details: `raw/linux/ssh-config.md`.

## 10. Logs and logins (step 11)

```bash
sudo grep "Failed password" /var/log/auth.log
sudo awk '/Failed password/ {print $(NF-3)}' /var/log/auth.log | sort | uniq -c | sort -rn
last -a | head          # successful logins
sudo lastb | head       # failed logins
lastlog                 # last login per user
who; w                  # who is logged in now, and what they run
sudo journalctl -u ssh --since today
```

Files: `/var/log/auth.log` (Debian/Ubuntu) or `/var/log/secure` (RHEL), `/var/log/syslog`, `/var/log/wtmp`, `/var/log/btmp`, `/var/log/faillog`.

## 11. Firewall (step 12)

```bash
sudo ufw status verbose | numbered
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp
sudo ufw allow from 192.168.56.0/24 to any port 22 proto tcp
sudo ufw deny 8080
sudo ufw delete 3
sudo ufw enable | disable | reload
sudo ufw logging on
sudo nft list ruleset
```

## 12. Hardening and auditing (step 13)

```bash
sudo apt update && sudo apt upgrade
apt list --upgradable
systemctl status unattended-upgrades
sudo awk -F: '$2==""' /etc/shadow        # empty passwords
getent group sudo
sudo lynis audit system
ls -l /etc/shadow /etc/passwd
```

## 13. Persistence checks (step 14)

```bash
crontab -l; sudo crontab -l -u USER
sudo ls /etc/cron.* /var/spool/cron/crontabs
systemctl list-unit-files --state=enabled
systemctl list-timers
ls -la /etc/systemd/system ~/.config/systemd/user
cat ~/.ssh/authorized_keys
tail ~/.bashrc ~/.profile; ls /etc/profile.d
ls -la /etc/rc.local /etc/init.d
diff -r baseline/ now/
```

## 14. Privileges (step 15)

```bash
find / -xdev \( -perm -4000 -o -perm -2000 \) -type f 2>/dev/null   # SUID/SGID
getcap -r / 2>/dev/null
sudo -l
find / -xdev -type f -perm -o+w 2>/dev/null                         # world-writable
find / -xdev -nouser -o -nogroup 2>/dev/null                        # orphan files
```

## 15. Lab, tools and web (steps 16-18)

```bash
VBoxManage list vms
VBoxManage snapshot "target" take "clean-install"
VBoxManage snapshot "target" restore "clean-install"
VBoxManage snapshot "target" list
docker run --rm -p 127.0.0.1:3000:3000 bkimminich/juice-shop
python3 -m http.server 8000 --bind 127.0.0.1
```

## 16. Evidence and integrity (step 19)

```bash
sha256sum file                  # fingerprint
sha256sum -c hashes.txt         # verify against a list
md5sum file                     # weaker, for matching only
sudo find / -xdev -newermt "2026-10-01" -type f 2>/dev/null
sudo journalctl --since "2026-10-25 20:00" --until "2026-10-25 23:00"
dpkg -V                         # Debian: verify installed package files
rpm -Va                         # RHEL: verify installed package files
```

## Quick reminders

- `2>/dev/null` hides errors; use it knowingly.
- `sort` before `uniq -c`.
- Keep a second SSH session open when changing SSH or firewall rules.
- Snapshot before hardening, copy evidence before cleanup.
