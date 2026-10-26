# SUID, SGID and Capabilities

## Definition
Special permissions that let a program run with its owner's rights (SUID/SGID) or with part of root's power (capabilities).

## Mental Model
A SUID root program is powerful by design, so any flaw in it, or any way to make it run arbitrary commands, is a privilege-escalation path. Sudo rules that allow an editor, interpreter or `find` can often be turned into a root shell. The goal here is defensive: find and remove, not exploit.

## Example
```bash
find / -perm -4000 -type f 2>/dev/null
getcap -r / 2>/dev/null
sudo -l
```
A SUID copy of `/bin/bash` is dangerous because it gives a root shell to anyone who runs it.

## Guided Practice
- List SUID/SGID files and compare with the standard list for your distribution; also `getcap -r /`, `sudo -l`, world-writable files.
- Write each finding as path, owner, risk, fix. Example: a SUID root file writable by a group can be replaced and run as root; fix by restoring root-only write.
- `docker` group membership is close to root access. Removing SUID from a system binary can break it.

## Advanced Scenario
Scenario 3, a normal user account was compromised. What could it turn into root?
```bash
sudo -l -U user
getent group sudo docker adm
```
Look for SUID files outside the standard list, writable SUID files, `NOPASSWD` or wildcard sudo rules, sudo rights on editors, interpreters or `find`, users in `docker`, and root-run scripts in writable locations. Fix: `chmod u-s`, tighten sudoers with `visudo`, remove users from `docker`, make root-run scripts root-owned and non-writable.

## Related Concepts
- [[linux-permissions]]
- [[system-hardening]]
- [[security-assessment-report]]
- [[cyber-learning-path]]
- [[security-scenarios]]

## Sources
- [[raw/learn/cyber-linux/stage-c-linux-security.md]]
- [[raw/learn/cyber-linux/steps/step-15-advanced-permissions.md]]
- [[raw/linux/cyber-scenarios.md]]
