# Linux Users and Permissions

## Definition
Every file has an owner, a group and read/write/execute bits for owner, group and others. `sudo` lets a user run commands as another user, usually root.

## Mental Model
Three audiences, three bits each: `r=4 w=2 x=1`. `640` means owner read+write, group read, others nothing. A directory needs `x` to be entered.

## Example
```bash
ls -l file          # -rw-r----- root adm file
chmod 640 file
id; groups; sudo -l
```
A file `-rw-r----- root adm` can be read by root and members of `adm`.

## Guided Practice
- For any "permission denied", name the user, group, mode and the missing bit.
- Create a file, `chmod 640`, then read it as a test user with `sudo -u tester cat note.txt`. Add the user to the file's group: reading works, writing still fails.
- Compare `ls -l /etc/passwd /etc/shadow` to see why one is world-readable.
- Group changes apply to new sessions. `chmod -R 777` fixes the symptom and breaks the security.

## Related Concepts
- [[linux-processes-services]]
- [[suid-and-capabilities]]
- [[system-hardening]]
- [[cyber-learning-path]]
- [[grep]]
- [[linux-filesystem-navigation]]
- [[rogue-accounts]]

## Sources
- [[raw/learn/cyber-linux/stage-a-linux-foundations.md]]
- [[raw/learn/cyber-linux/steps/step-03-users-and-permissions.md]]
