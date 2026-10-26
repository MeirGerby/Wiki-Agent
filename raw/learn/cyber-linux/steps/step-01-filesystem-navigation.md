# Step 1 (שלב 1) — Navigating the Filesystem

Stage A. Goal: move around Linux confidently and find files fast.

## Learn

- Everything is a file, under one root `/`. Absolute paths start with `/`; relative paths start from where you are.
- Key directories: `/etc` config, `/var/log` logs, `/home` users, `/tmp` temporary files, `/usr/bin` programs, `/proc` live kernel and process info.
- Commands: `pwd`, `ls -la`, `cd`, `cd -`, `tree -L 2`, `find`, `stat`, `file`.
- Shortcuts: `~` home, `.` here, `..` parent, tab completion.

## Guided exercise

1. `pwd`, then `cd /etc`, then `cd -` to jump back. Use `ls -la` and find a hidden file.
2. Find every `.conf` file under `/etc` (the path's exercise):
   `find /etc -name "*.conf" 2>/dev/null | head`
3. Count them: `find /etc -name "*.conf" 2>/dev/null | wc -l`.
4. Find files changed in the last day: `find /etc -mtime -1 -type f 2>/dev/null`.
5. Find large files in your home directory: `find ~ -type f -size +50M 2>/dev/null`.
6. Run `stat /etc/passwd` and read owner, size and the three timestamps.

## What good looks like

- You can reach any directory without the mouse.
- You know the difference between `-name`, `-iname`, `-type`, `-mtime`, `-size`.

## Pitfalls

- `2>/dev/null` hides permission errors, and can also hide a useful message.
- `find` quoting: write `"*.conf"` in quotes or the shell expands it first.
- Relative paths in scripts depend on the current directory.

## Daily summary prompts

Draw the top two levels of the Linux directory tree from memory, with one line per directory.

## Review questions

1. What is the difference between `/etc` and `/var/log`?
2. What does `cd -` do?
3. Why quote the pattern in `find -name "*.conf"`?
