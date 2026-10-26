# ssh

## Definition
Client for secure remote login and tunnelling. Its behaviour comes from `~/.ssh/config`, key pairs and an agent, so long commands are rarely typed by hand.

## Mental Model
`~/.ssh/config` is an address book: each `Host` block gives a short name a real address, user, port and key. Keys are the identity card; the agent holds the unlocked card for the session.

## Example
```sshconfig
Host myserver
    HostName 203.0.113.10
    User deploy
    IdentityFile ~/.ssh/id_work
    IdentitiesOnly yes
```
Then `ssh myserver`. The first matching value for each option wins, so put specific hosts before `Host *`.

## Related Concepts
- [[ssh-keys-and-agent]]
- [[ssh-tunnels]]
- [[github-multi-account-auth]]
- [[git]]
- [[gh]]
- [[network-fundamentals]]
- [[system-hardening]]
- [[cyber-learning-path]]
- [[cyber-command-reference]]

## Sources
- [[raw/linux/ssh-config.md]]
- [[raw/learn/cyber-linux/stage-b-networking.md]]
