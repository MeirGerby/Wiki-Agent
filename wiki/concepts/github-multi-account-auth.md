# GitHub Multi-Account Authentication

## Definition
Using more than one GitHub account on one machine, either with `gh auth switch` over HTTPS or with one SSH host alias and key per account.

## Mental Model
Over HTTPS, `git push` uses the **active** `gh` account, so a `403 Permission denied to <user>` means the wrong account is active. Over SSH, the account is chosen by which key the alias presents, so there is no hidden global state.

## Example
```bash
gh auth status
gh auth switch -u MeirGerby
```
```sshconfig
Host github-work
    HostName github.com
    User git
    IdentityFile ~/.ssh/id_work
    IdentitiesOnly yes
```
Then `git clone git@github-work:org/repo.git`. A "token in keyring is invalid" message means that account needs `gh auth login` again. `GH_TOKEN` in the environment overrides stored logins.

## Related Concepts
- [[gh]]
- [[ssh]]
- [[ssh-keys-and-agent]]
- [[git]]

## Sources
- [[raw/linux/gh.md]]
- [[raw/linux/ssh-config.md]]
