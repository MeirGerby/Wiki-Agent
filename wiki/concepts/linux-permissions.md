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

## Related Concepts
- [[linux-processes-services]]
- [[suid-and-capabilities]]
- [[system-hardening]]
- [[cyber-learning-path]]
- [[grep]]

## Sources
- [[raw/learn/cyber-linux/stage-a-linux-foundations.md]]
