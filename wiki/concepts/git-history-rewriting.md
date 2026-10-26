# Git History Rewriting

## Definition
Changing existing commits: `rebase` (including interactive), `cherry-pick`, `commit --amend` and `filter-repo`. Rewriting changes every later SHA.

## Mental Model
Rebase replays your commits on a new base, producing *new* commits. That is fine for private work and risky once others have pulled the old ones. Prefer `--force-with-lease` over `--force` when you must overwrite a remote branch.

## Example
```bash
git rebase -i HEAD~5                       # reorder, squash, reword, drop
git commit --fixup <commit> && git rebase -i --autosquash HEAD~5
git cherry-pick -x <commit>
git push --force-with-lease
```
`git filter-repo` is a separate tool (not bundled with git) that replaces `filter-branch`; every collaborator must re-clone afterwards.

## Related Concepts
- [[git]]
- [[git-undo-and-recovery]]
- [[git-patches]]

## Sources
- [[raw/linux/git.md]]
