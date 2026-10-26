# git

## Definition
Distributed version control system. It records changes to files as a graph of commits and lets many copies of a repository stay in sync.

## Mental Model
Three areas: the **working tree** (files on disk), the **index** (what the next commit will contain) and the **repository** (history). A branch is just a movable pointer to a commit; `HEAD` points at where you are. Most commands move content between the three areas or move pointers.

## Example
```bash
git add -p                      # stage hunk by hunk
git commit -m "message"
git log --oneline --graph --decorate --all
git switch -c feature           # create and switch to a branch
git pull --rebase               # fetch + rebase instead of merge commit
```
Advanced commands are split into [[git-patches]], [[git-undo-and-recovery]] and [[git-history-rewriting]]. Also in the source: `stash`, `bisect`, `worktree`, submodules, tags, hooks and plumbing (`gc`, `fsck`, `bundle`).

## Related Concepts
- [[git-patches]]
- [[git-undo-and-recovery]]
- [[git-history-rewriting]]
- [[gh]]
- [[ssh]]
- [[grep]]
- [[pipes]]
- [[github-multi-account-auth]]

## Sources
- [[raw/linux/git.md]]
