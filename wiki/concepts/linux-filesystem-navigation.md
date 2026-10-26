# Linux Filesystem Navigation

## Definition
Moving around the single Linux directory tree rooted at `/` and finding files with `ls`, `cd`, `tree`, `find` and `stat`.

## Mental Model
Everything is a file under one root. Absolute paths start at `/`; relative paths start from where you are. Learn the map: `/etc` config, `/var/log` logs, `/home` users, `/tmp` temporary, `/usr/bin` programs, `/proc` live kernel and process info.

## Example
```bash
find /etc -name "*.conf" 2>/dev/null | head      # quote the pattern
find /etc -mtime -1 -type f 2>/dev/null         # changed in the last day
find ~ -type f -size +50M 2>/dev/null           # large files
stat /etc/passwd                                # owner, size, timestamps
```
`2>/dev/null` hides permission errors, and can also hide a useful message.

## Related Concepts
- [[linux-permissions]]
- [[recursive-search]]
- [[grep]]
- [[cyber-learning-path]]
- [[cyber-command-reference]]

## Sources
- [[raw/learn/cyber-linux/steps/step-01-filesystem-navigation.md]]
