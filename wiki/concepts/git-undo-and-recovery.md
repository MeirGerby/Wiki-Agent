# Git Undo and Recovery

## Definition
The set of commands for reverting work: `restore`, `reset`, `revert`, `clean`, and the `reflog` for finding commits that seem lost.

## Mental Model
Separate *moving a pointer* (`reset` rewrites history) from *adding an opposite commit* (`revert` is safe on shared branches). `--hard` and `git clean -f` destroy uncommitted work with no undo; the reflog is the safety net for commits only.

## Example
```bash
git restore --staged file.txt     # unstage
git reset --soft HEAD~1           # undo commit, keep changes staged
git revert <commit>               # undo safely with a new commit
git reflog                        # where HEAD has been
git branch rescue <sha>           # re-attach a dangling commit
```
The reflog is local only and entries expire (default about 90 days).

## Related Concepts
- [[git]]
- [[git-history-rewriting]]
- [[git-patches]]

## Sources
- [[raw/linux/git.md]]
