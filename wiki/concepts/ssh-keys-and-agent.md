# SSH Keys and ssh-agent

## Definition
Public-key login: a private key stays with you, the matching public key sits in the server's `~/.ssh/authorized_keys`. `ssh-agent` keeps the decrypted key in memory for the session.

## Mental Model
Public key = a lock you can hand out; private key = the only key that opens it. A passphrase encrypts the private key on disk; the agent saves you retyping it.

## Example
```bash
ssh-keygen -t ed25519 -C "me@example.com"
ssh-copy-id -i ~/.ssh/id_ed25519.pub user@host
eval "$(ssh-agent -s)" && ssh-add ~/.ssh/id_ed25519
chmod 700 ~/.ssh && chmod 600 ~/.ssh/id_ed25519
```
ssh refuses keys whose permissions are too open. Without `IdentitiesOnly yes`, ssh may try every agent key and hit the server's `MaxAuthTries`.

## Related Concepts
- [[ssh]]
- [[ssh-tunnels]]
- [[github-multi-account-auth]]
- [[gh]]
- [[system-hardening]]
- [[network-fundamentals]]
- [[persistence-mechanisms]]

## Sources
- [[raw/linux/ssh-config.md]]
- [[raw/learn/cyber-linux/stage-b-networking.md]]
