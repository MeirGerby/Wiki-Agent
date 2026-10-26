# Step 15 (שלב 15) — Advanced Permissions and Local Weaknesses

Stage C. Goal: find unusual permissions on a lab machine and explain the risk and the fix.

Defensive goal: find and remove, not exploit.

## Learn

- **SUID** (`4000`): runs as the file owner. **SGID** (`2000`): runs as the group; on directories new files inherit the group. **Sticky bit** (`1000`): only the owner can delete in the directory (`/tmp`).
- **Capabilities**: pieces of root power on a binary (e.g. `cap_net_bind_service`).
- **Sudo rules**: `sudo -l` shows what is allowed; `NOPASSWD` and wildcard rules need extra care.
- **Groups with power**: `sudo`, `docker`, `adm`, `disk`.

## Guided exercise

1. List SUID and SGID files: `find / -xdev \( -perm -4000 -o -perm -2000 \) -type f 2>/dev/null`.
2. Compare with the standard list for your distribution (e.g. `passwd`, `sudo`, `mount`). Write down anything else.
3. List capabilities: `getcap -r / 2>/dev/null`.
4. Review sudo: `sudo -l` for each user, and `sudo cat /etc/sudoers /etc/sudoers.d/*`.
5. List world-writable files outside `/tmp`: `find / -xdev -type f -perm -o+w 2>/dev/null`.
6. For each unusual item write: path, owner, why it might exist, risk, fix.

## Example risk write-up

> `/usr/local/bin/backup` is SUID root and is writable by group `staff`. Anyone in `staff` could replace it and run code as root. Fix: remove SUID or restrict write to root (`chmod 4750`, `chown root:root`).

## What good looks like

- Each item has a clear risk statement and a concrete fix.
- You can explain why `docker` group membership is close to root access.

## Pitfalls

- Removing SUID from a system binary can break it; check the package first.
- Do not test exploits on systems you do not own.

## Daily summary prompts

List your top three findings ranked by risk.

## Review questions

1. What does the SUID bit do on a file?
2. Why is a world-writable SUID file dangerous?
3. What does the sticky bit protect in `/tmp`?
