# Step 3 — Practice

Goal: use the idea hands-on, in a safe place.

1. Give one small exercise that needs the concept just taught (for example: make a throwaway repo and move two commits with `git format-patch` and `git am`).
2. Use a safe sandbox: a temp directory, a throwaway repo, or a lab VM. Never touch real repos, production systems, or machines the learner does not own.
3. State the goal and the expected result, not the commands. Give hints only when asked.
4. Review what the learner did: what worked, what failed, what the error message meant.
5. For anything risky (`reset --hard`, `clean -f`, `push --force`, scans, firewall rules), confirm it runs only in the sandbox.

Output: the exercise, a review of the attempt, and any new gap to record in step 4.
