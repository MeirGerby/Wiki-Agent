# Step 2 (שלב 2) — Working with Files and Text

Stage A. Goal: search and summarise text, for example find suspicious words in a log file.

Related wiki pages: grep, sed, awk, pipes.

## Learn

- Viewing: `cat`, `less`, `head`, `tail -f`, `wc -l`.
- Searching: `grep -i`, `-n`, `-r`, `-v`, `-E`, `-c`.
- Shaping: `sort`, `uniq -c`, `cut -d' ' -f1`, `tr`, `sed 's/a/b/g'`, `awk '{print $1}'`.
- Combining: `cmd1 | cmd2`, `>` overwrite, `>>` append, `2>&1`.

## Guided exercise

1. Create a sample log:
   ```bash
   cat > access.log <<'LOG'
   10.0.0.5 GET /index.html 200
   10.0.0.5 GET /admin 403
   10.0.0.7 POST /login 401
   10.0.0.5 POST /login 401
   10.0.0.9 GET /index.html 200
   LOG
   ```
2. Find suspicious lines: `grep -E " (401|403) " access.log`.
3. Count requests per IP, highest first: `awk '{print $1}' access.log | sort | uniq -c | sort -rn`.
4. Count failures per IP: `grep -E " (401|403)$" access.log | awk '{print $1}' | sort | uniq -c | sort -rn`.
5. Mask the IP last octet: `sed -E 's/\.[0-9]+ / .x /' access.log`.
6. Save the result: `... > report.txt`, then inspect with `less report.txt`.

## What good looks like

- You build the answer one pipe stage at a time and check the output at each stage.
- You can read the pipeline aloud: "take field 1, sort, count duplicates, rank".

## Pitfalls

- `uniq` only merges adjacent lines, so `sort` first.
- `grep` patterns are regular expressions; `.` matches any character.
- `>` overwrites silently; use `>>` to append.

## Daily summary prompts

Write the pipeline that ranks the top five items in a log, and explain each stage.

## Review questions

1. Why must you `sort` before `uniq -c`?
2. What is the difference between `>` and `>>`?
3. How do you search a directory tree for a word?
