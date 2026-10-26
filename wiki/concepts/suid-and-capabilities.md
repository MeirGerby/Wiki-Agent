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

## Related Concepts
- [[linux-permissions]]
- [[system-hardening]]
- [[security-assessment-report]]
- [[cyber-learning-path]]

## Sources
- [[raw/learn/cyber-linux/stage-c-linux-security.md]]
