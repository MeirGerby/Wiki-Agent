# Git Patches (format-patch and am)

## Definition
A way to move commits between machines as plain-text files, with no shared remote. `git format-patch` writes them; `git am` applies them as commits; `git apply` applies a plain diff to the working tree.

## Mental Model
Think of mailing someone your commits. `format-patch` puts each commit in an envelope (author, date, message, diff); `am` opens the envelope and recreates the commit. A plain `git diff` has no envelope, so only `apply` can use it.

## Example
```bash
git format-patch -3 -o /tmp/patches      # last 3 commits -> files
git am /tmp/patches/*.patch              # on the other machine
git am --3way *.patch                    # fall back to 3-way merge
git am --abort                           # cancel and restore
```

## Related Concepts
- [[git]]
- [[git-history-rewriting]]
- [[git-undo-and-recovery]]

## Sources
- [[raw/linux/git.md]]
