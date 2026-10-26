# Step 3 (שלב 3) — Users and Permissions

Stage A. Goal: understand why a user can read a file but not edit it.

## Learn

- Identity: `id`, `whoami`, `groups`. Every process runs as a user with groups.
- Account files: `/etc/passwd` (users, no passwords), `/etc/shadow` (hashes, root only), `/etc/group`.
- Mode bits: `r=4 w=2 x=1` for owner, group, others. `640` = `rw-r-----`.
- Change: `chmod 640 f`, `chmod u+x f`, `chown user:group f`.
- Directories: `x` lets you enter, `r` lets you list, `w` lets you create or delete entries.
- `sudo`: run a command as another user, usually root. `sudo -l` lists what you may run.

## Guided exercise

1. Create a file and look at it: `echo hi > note.txt; ls -l note.txt`.
2. Make it read-only for group and nothing for others: `chmod 640 note.txt`.
3. Create a test user and group (lab machine): `sudo useradd -m tester`, then `sudo -u tester cat note.txt`. Explain the result.
4. Add `tester` to the file's group and retry. Then try to write: `sudo -u tester sh -c 'echo x >> note.txt'`. Explain why reading works and writing fails.
5. Show why `/etc/shadow` is protected: `ls -l /etc/passwd /etc/shadow`.
6. Run `sudo -l` and list what you are allowed to do.

## What good looks like

- For any "permission denied" you can name the user, group, mode and which bit is missing.
- You can explain why a directory's `x` bit matters.

## Pitfalls

- Group changes apply to new sessions only (`newgrp` or log in again).
- `chmod -R 777` fixes the symptom and breaks the security.
- Editors can replace the file (new inode), so permission behaviour surprises beginners.

## Daily summary prompts

Write a permission table for one file: owner, group, others, and what each can do.

## Review questions

1. What does `640` mean?
2. Why can a user read `/etc/passwd` but not `/etc/shadow`?
3. What permission lets you delete a file in a directory?
