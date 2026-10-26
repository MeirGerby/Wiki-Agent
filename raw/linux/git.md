# git

Distributed version control system. Tracks changes to files as a graph of commits.

## Core model

- **Working tree**: the files on disk.
- **Index (staging area)**: the snapshot being prepared for the next commit.
- **Repository (`.git`)**: the commit history (objects + refs).
- **HEAD**: pointer to the currently checked-out commit (usually via a branch).
- **Branch**: a movable pointer to a commit. **Tag**: a fixed pointer.
- **Remote**: another copy of the repo (e.g. `origin`).

## Setup and configuration

* [ ] 
  ```bash
  git init                                   # create a repo in the current dir
  git clone <url> [dir]                      # copy a remote repo
  git clone --depth 1 <url>                  # shallow clone (latest commit only)
  git config --global user.name "Name"
  git config --global user.email "me@example.com"
  git config --global core.editor "vim"
  git config --global alias.st status        # create an alias: git st
  git config --list --show-origin            # show all settings and where they come from
  ```

Config levels: `--system`, `--global` (`~/.gitconfig`), `--local` (`.git/config`).

## Everyday commands

```bash
git status                  # working tree / index state
git status -s               # short format
git add file.txt            # stage a file
git add -p                  # stage interactively, hunk by hunk
git add -A                  # stage everything (new, modified, deleted)
git commit -m "message"     # commit staged changes
git commit -am "message"    # stage tracked changes and commit
git commit --amend          # rewrite the last commit (message and/or content)
git rm file.txt             # delete and stage the deletion
git rm --cached file.txt    # untrack but keep on disk
git mv old.txt new.txt      # rename and stage
```

## Inspecting history

```bash
git log
git log --oneline --graph --decorate --all   # compact branch graph
git log -p file.txt                          # history with diffs for one file
git log --stat                               # files changed per commit
git log --author="name" --since="2 weeks ago"
git log --grep="fix"                         # search commit messages
git log -S"functionName"                     # pickaxe: commits that add/remove a string
git log -G"regex"                            # commits whose diff matches a regex
git log main..feature                        # commits in feature but not in main
git log main...feature                       # commits in either, but not both
git show <commit>                            # one commit with its diff
git show <commit>:path/to/file               # a file as of that commit
git diff                                     # working tree vs index
git diff --staged                            # index vs HEAD
git diff main..feature                       # between two refs
git diff --name-only                         # just file names
git blame file.txt                           # who last changed each line
git blame -L 10,20 file.txt                  # only lines 10-20
git shortlog -sn                             # commits per author
```

## Branching and merging

```bash
git branch                       # list local branches
git branch -a                    # include remote-tracking branches
git branch feature               # create
git branch -d feature            # delete (only if merged)
git branch -D feature            # force delete
git branch -m new-name           # rename current branch
git switch feature               # switch branch (modern)
git switch -c feature            # create and switch
git checkout feature             # switch branch (older form)
git checkout -b feature          # create and switch (older form)
git merge feature                # merge into the current branch
git merge --no-ff feature        # always create a merge commit
git merge --squash feature       # combine changes without a merge commit
git merge --abort                # cancel a conflicted merge
```

Merge conflicts: edit the marked files (`<<<<<<<`, `=======`, `>>>>>>>`), then `git add` them and `git commit`.

## Remotes

```bash
git remote -v                         # list remotes
git remote add origin <url>
git fetch                             # download without merging
git fetch --prune                     # also drop deleted remote branches
git pull                              # fetch + merge
git pull --rebase                     # fetch + rebase
git push                              # upload current branch
git push -u origin feature            # push and set upstream
git push origin --delete feature      # delete a remote branch
git push --force-with-lease           # safer force push (fails if remote changed)
git push --tags
```

## Undoing changes

| Goal                                   | Command                                  |
| -------------------------------------- | ---------------------------------------- |
| Discard unstaged edits to a file       | `git restore file.txt`                 |
| Unstage a file                         | `git restore --staged file.txt`        |
| Undo a commit, keep changes staged     | `git reset --soft HEAD~1`              |
| Undo a commit, keep changes unstaged   | `git reset --mixed HEAD~1` (default)   |
| Undo a commit, discard changes         | `git reset --hard HEAD~1`              |
| Undo a commit safely with a new commit | `git revert <commit>`                  |
| Delete untracked files (dry run first) | `git clean -n`, then `git clean -fd` |

- `reset` moves the branch pointer (rewrites history). Avoid on shared branches.
- `revert` adds a new commit that inverses an old one. Safe on shared branches.
- `--hard` and `git clean -f` destroy uncommitted work with no undo.

## Advanced commands

### Rebase

```bash
git rebase main                  # replay current branch commits on top of main
git rebase -i HEAD~5             # interactive: reorder, squash, edit, drop, reword
git rebase --onto newbase oldbase branch   # transplant a range of commits
git rebase --continue            # after resolving a conflict
git rebase --abort
git rebase --autosquash          # apply fixup!/squash! commits automatically
git commit --fixup <commit>      # create a fixup commit for later autosquash
```

Interactive rebase verbs: `pick`, `reword`, `edit`, `squash`, `fixup`, `drop`.
Rule of thumb: never rebase commits that others already pulled.

### Cherry-pick

```bash
git cherry-pick <commit>         # apply one commit onto the current branch
git cherry-pick A..B             # a range (excludes A)
git cherry-pick -x <commit>      # record the source commit in the message
git cherry-pick --abort
```

### Patches (`format-patch`, `am`, `apply`): move commits to another machine

Export commits as plain-text patch files, copy them (USB, email, scp), then apply them elsewhere. No shared remote needed.

On the source machine:

```bash
git format-patch -1 <commit>              # one commit -> 0001-subject.patch
git format-patch -3                       # last 3 commits -> 3 files
git format-patch main..feature            # every commit in feature not in main
git format-patch <sha>^..<sha>            # an inclusive range of commits
git format-patch -o /tmp/patches main     # write files into a directory
git format-patch --stdout main > all.mbox # all commits in a single file
git diff main > changes.patch             # plain diff only (no author/message/commit info)
```

On the target machine (inside a clone of the same repo, ideally at a similar base commit):

```bash
git am 0001-subject.patch                 # apply and create the commit
git am /tmp/patches/*.patch               # apply a series in order
git am --3way *.patch                     # fall back to a 3-way merge if context differs
git am --signoff *.patch                  # add your Signed-off-by line
git am --abort                            # cancel and restore the original state
git am --continue                         # after fixing a conflict and `git add`
git am --skip                             # skip the failing patch
```

Applying a plain diff (no commit created, changes land in the working tree):

```bash
git apply --check changes.patch           # dry run: would it apply cleanly?
git apply --stat changes.patch            # show which files it touches
git apply changes.patch                   # apply to the working tree
git apply --index changes.patch           # apply and stage
git apply --3way changes.patch            # try a 3-way merge on conflicts
```

Which to use:

| Tool                      | Creates a commit | Keeps author, date, message |
| ------------------------- | ---------------- | --------------------------- |
| `format-patch` + `am` | yes              | yes                         |
| `diff` + `apply`      | no               | no                          |

Notes:

- `am` expects the mailbox format produced by `format-patch`; it will not accept a plain `git diff` file (use `apply`).
- If `am` hits a conflict it stops mid-way. Resolve the files, `git add` them, then `git am --continue`.
- Patches record the binary-safe diff only with `--binary` (`git format-patch --binary` / `git diff --binary`); otherwise binary files are skipped.
- Line-ending or whitespace problems: `git am --ignore-whitespace` or `git apply --ignore-whitespace`.
- Email workflow: `git send-email *.patch` sends a series; the receiver runs `git am` on the saved messages.
- Alternative for whole history in one file: `git bundle` (see Plumbing and maintenance).

### Stash

```bash
git stash                        # shelve tracked changes
git stash -u                     # include untracked files
git stash push -m "wip" -- path  # stash named, only some paths
git stash list
git stash show -p stash@{0}
git stash pop                    # apply and drop
git stash apply stash@{1}        # apply and keep
git stash drop stash@{0}
git stash branch new-branch      # create a branch from a stash
```

### Reflog (recover "lost" commits)

```bash
git reflog                       # history of where HEAD has been
git reset --hard HEAD@{2}        # return to an earlier state
git branch rescue <sha>          # re-attach a dangling commit to a branch
```

The reflog is local only, and entries expire (default about 90 days).

### Bisect (find the commit that introduced a bug)

```bash
git bisect start
git bisect bad                   # current commit is broken
git bisect good <commit>         # a known-good commit
# git checks out midpoints; mark each good/bad
git bisect reset                 # finish
git bisect run ./test.sh         # automate: script exits 0 = good, non-zero = bad
```

### Worktrees (multiple checkouts of one repo)

```bash
git worktree add ../hotfix hotfix-branch
git worktree list
git worktree remove ../hotfix
```

### Submodules and subtrees

```bash
git submodule add <url> path
git submodule update --init --recursive
git clone --recurse-submodules <url>
git subtree add --prefix=lib <url> main --squash
```

### Tags

```bash
git tag v1.0.0                       # lightweight tag
git tag -a v1.0.0 -m "release"       # annotated tag
git tag -d v1.0.0
git push origin v1.0.0
git describe --tags                  # nearest tag + distance
```

### Searching and filtering

```bash
git grep "pattern"                   # search tracked files
git grep -n -e "foo" --and -e "bar"
git ls-files                         # list tracked files
git ls-tree -r HEAD                  # files in a commit
git cat-file -p <sha>                # print any object
git rev-parse HEAD                   # resolve a ref to a SHA
git merge-base main feature          # common ancestor
git range-diff A...B                 # compare two versions of a patch series
```

### History rewriting at scale

```bash
git filter-repo --path secrets.txt --invert-paths   # remove a file from all history
git commit --amend --reset-author
git rebase -i --root                                # edit from the very first commit
```

`git filter-repo` is a separate tool (not bundled with git). It replaces the older `git filter-branch`. Rewriting history changes every later SHA, so all collaborators must re-clone or reset.

### Hooks

Scripts in `.git/hooks/` run on events: `pre-commit`, `commit-msg`, `pre-push`, `post-merge`. Share them with `git config core.hooksPath .githooks`.

### Plumbing and maintenance

```bash
git gc                         # compact the object database
git fsck                       # verify integrity, find dangling objects
git count-objects -vH          # repo size
git maintenance start          # schedule background upkeep
git archive -o out.zip HEAD    # export a snapshot without .git
git bundle create repo.bundle --all   # portable single-file repo
```

## Combining with other Linux tools

```bash
git log --oneline | grep -i "fix"                          # filter log with grep
git diff --name-only | xargs wc -l                         # count lines in changed files
git branch --merged main | grep -v main | xargs git branch -d   # delete merged branches
git log --format='%an' | sort | uniq -c | sort -rn         # commits per author
```

## Gotchas

- `git pull` can silently create merge commits; prefer `git pull --rebase` or `git fetch` then inspect.
- `git push --force` can overwrite teammates' work; use `--force-with-lease`.
- Files in `.gitignore` are ignored only if untracked; for tracked files use `git rm --cached`.
- Detached HEAD (checking out a commit/tag): commits made there are lost unless you create a branch (`git switch -c name`).
- `git checkout` does many things (switch branches, restore files); `git switch` and `git restore` split those roles.
