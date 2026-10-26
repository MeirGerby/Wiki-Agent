# gh

GitHub's official command-line tool. Works with repos, pull requests, issues, Actions, releases and the API from the terminal. Separate from `git`: `git` handles local version control, `gh` talks to GitHub.

## Install

```bash
# Debian/Ubuntu: see https://github.com/cli/cli/blob/trunk/docs/install_linux.md
sudo apt install gh
brew install gh                 # macOS / Linuxbrew
winget install GitHub.cli       # Windows
gh --version
```

## Authentication

```bash
gh auth login                       # interactive login (browser or token)
gh auth login -h github.com         # choose host explicitly
gh auth login --with-token < token.txt
gh auth status                      # accounts, active account, token scopes
gh auth switch -u <user>            # change the active account (multi-account)
gh auth logout -h github.com -u <user>
gh auth refresh -s workflow         # add token scopes
gh auth setup-git                   # let git use gh as its HTTPS credential helper
gh auth token                       # print the active token
```

Gotcha: with several accounts logged in, a `git push` over HTTPS uses the **active** account. A `403 Permission denied to <user>` means the wrong account is active; fix with `gh auth switch`. A "token in keyring is invalid" message means that account needs `gh auth login` again.

## Configuration

```bash
gh config list
gh config set editor vim
gh config set git_protocol ssh      # clone/push over SSH instead of HTTPS
gh config set prompt disabled       # no interactive prompts (scripts)
gh alias set pv 'pr view'           # custom shortcut: gh pv
gh alias list
```

Environment: `GH_TOKEN` / `GITHUB_TOKEN` (auth in CI), `GH_HOST`, `GH_REPO` (target repo as `OWNER/REPO`), `GH_PAGER`.

## Repositories

```bash
gh repo create my-repo --public --source=. --remote=origin --push   # from an existing local dir
gh repo create my-repo --private --clone
gh repo clone owner/repo
gh repo view [owner/repo] [--web]
gh repo list [owner] --limit 50
gh repo fork owner/repo --clone
gh repo edit --description "text" --visibility private --accept-visibility-change-consequences
gh repo rename new-name
gh repo archive owner/repo
gh repo delete owner/repo --yes     # destructive, needs delete_repo scope
gh repo sync                        # sync a fork with its upstream
gh repo set-default owner/repo      # which repo gh commands target
```

## Pull requests

```bash
gh pr create                                  # interactive
gh pr create --title "T" --body "B" --base main --draft
gh pr create --fill                           # title/body from commits
gh pr list [--state open|closed|merged|all] [--author @me] [--label bug]
gh pr view 123 [--web] [--comments]
gh pr status                                  # PRs relevant to you
gh pr checkout 123                            # fetch and switch to a PR branch
gh pr diff 123
gh pr checks 123 [--watch]                    # CI status
gh pr review 123 --approve
gh pr review 123 --request-changes --body "why"
gh pr review 123 --comment --body "note"
gh pr comment 123 --body "text"
gh pr edit 123 --add-label bug --add-reviewer user
gh pr ready 123                               # draft -> ready
gh pr merge 123 --squash --delete-branch      # or --merge / --rebase
gh pr merge 123 --auto --squash               # merge when checks pass
gh pr close 123
gh pr reopen 123
```

## Issues

```bash
gh issue create --title "T" --body "B" --label bug --assignee @me
gh issue list [--state open] [--assignee @me] [--label bug] [--search "text"]
gh issue view 45 [--web] [--comments]
gh issue comment 45 --body "text"
gh issue edit 45 --add-label triage
gh issue close 45 [--reason "not planned"]
gh issue reopen 45
gh issue develop 45 --checkout                # create and switch to a linked branch
gh issue transfer 45 owner/other-repo
gh issue pin 45
```

## GitHub Actions

```bash
gh workflow list
gh workflow view ci.yml
gh workflow run ci.yml -f env=staging         # trigger workflow_dispatch with inputs
gh workflow enable|disable ci.yml
gh run list [--workflow ci.yml] [--branch main] [--status failure]
gh run view <run-id> [--log] [--log-failed]
gh run watch <run-id>                         # follow a run live
gh run rerun <run-id> [--failed]
gh run cancel <run-id>
gh run download <run-id> [-n artifact-name]
gh cache list
gh cache delete <id>
```

## Releases

```bash
gh release create v1.0.0 --title "v1.0.0" --notes "text"
gh release create v1.0.0 --generate-notes ./dist/*.zip    # auto notes + upload assets
gh release create v1.0.0 --draft --prerelease
gh release list
gh release view v1.0.0
gh release download v1.0.0 -p "*.tar.gz"
gh release upload v1.0.0 file.zip --clobber
gh release delete v1.0.0 --cleanup-tag
```

## Secrets, variables, keys

```bash
gh secret set API_KEY                         # prompts for the value
gh secret set API_KEY < key.txt
gh secret set API_KEY --env production        # environment secret
gh secret set API_KEY --org my-org --visibility all
gh secret list
gh secret delete API_KEY
gh variable set NODE_ENV --body production
gh variable list
gh ssh-key add ~/.ssh/id_ed25519.pub --title "laptop"
gh ssh-key list
gh gpg-key add key.asc
```

## Other useful commands

```bash
gh browse                         # open repo in browser
gh browse 123                     # open issue/PR 123
gh browse src/index.ts:42         # open a file at a line
gh search repos "topic:nx language:typescript" --limit 10
gh search issues "is:open label:bug" --repo owner/repo
gh search prs --author @me --state open
gh gist create file.txt --public
gh gist list
gh codespace list                 # also: create, ssh, stop, delete
gh label list
gh label create bug --color d73a4a
gh extension install owner/gh-name
gh extension list
gh completion -s bash > /etc/bash_completion.d/gh
```

## gh api (raw REST and GraphQL)

```bash
gh api repos/owner/repo                               # GET
gh api repos/owner/repo/issues -f title="T" -f body="B"   # POST (-f string fields)
gh api -X PATCH repos/owner/repo -f description="x"
gh api repos/owner/repo/pulls --paginate              # follow all pages
gh api repos/owner/repo --jq '.stargazers_count'      # filter with jq syntax
gh api graphql -f query='{ viewer { login } }'
gh api user -H "Accept: application/vnd.github+json"
```

## Output control and scripting

```bash
gh pr list --json number,title,author --jq '.[] | "\(.number) \(.title)"'
gh pr list --json number --jq 'length'
gh issue list --json title,labels --template '{{range .}}{{.title}}{{"\n"}}{{end}}'
gh pr list -q '.[].number' --json number    # -q is short for --jq
```

Most list/view commands support `--json <fields>` (run with `--json` and no fields to see the list), `--jq`, and `--template`. Output to a pipe is plain tab-separated text, so it composes with `grep`, `awk`, `xargs`:

```bash
gh pr list --state merged --json headRefName --jq '.[].headRefName' | xargs -I{} git push origin --delete {}
gh run list --status failure --json databaseId --jq '.[].databaseId' | xargs -n1 gh run rerun
```

## Gotchas

- `gh` needs a repo context: run inside a clone, or pass `-R owner/repo` / set `GH_REPO`.
- `gh repo delete` and `gh release delete` are irreversible; they ask for confirmation unless `--yes` is passed.
- Token scopes matter: deleting repos needs `delete_repo`; editing workflow files needs `workflow`. Add scopes with `gh auth refresh -s <scope>`.
- `GH_TOKEN` in the environment overrides stored credentials, which can hide the account you thought was active.
- `git` and `gh` have independent identity: `git config user.name` sets commit authorship, `gh auth` sets who is allowed to push/call the API.
