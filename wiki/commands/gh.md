# gh (GitHub CLI)

## Definition
GitHub's official command-line tool for repositories, pull requests, issues, Actions runs, releases and the API.

## Mental Model
`git` handles local version control; `gh` talks to GitHub. They have separate identities: `git config user.name` sets commit authorship, while `gh auth` decides who may push or call the API.

## Example
```bash
gh auth status                    # accounts, active one, token scopes
gh pr create --fill               # title/body from commits
gh pr checks 123 --watch
gh run list --status failure --json databaseId --jq '.[].databaseId' | xargs -n1 gh run rerun
gh api repos/owner/repo --jq '.stargazers_count'
```

## Related Concepts
- [[git]]
- [[github-multi-account-auth]]
- [[ssh-keys-and-agent]]
- [[pipes]]
- [[ssh]]

## Sources
- [[raw/linux/gh.md]]
