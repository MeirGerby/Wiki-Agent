# ssh configuration

`ssh` connects securely to remote machines. Its behavior is controlled by config files, key pairs and an agent, so you rarely type long commands by hand.

## Files and locations

| Path | Purpose |
| --- | --- |
| `~/.ssh/config` | Per-user client config (hosts, keys, options) |
| `/etc/ssh/ssh_config` | System-wide client config |
| `~/.ssh/id_ed25519` | Private key. Never share. |
| `~/.ssh/id_ed25519.pub` | Public key. Safe to share. |
| `~/.ssh/authorized_keys` | Public keys allowed to log in to this account (server side) |
| `~/.ssh/known_hosts` | Fingerprints of servers you already trusted |
| `/etc/ssh/sshd_config` | SSH **server** config |

Required permissions (ssh refuses to use keys if too open):

```bash
chmod 700 ~/.ssh
chmod 600 ~/.ssh/config ~/.ssh/id_ed25519 ~/.ssh/authorized_keys
chmod 644 ~/.ssh/id_ed25519.pub ~/.ssh/known_hosts
```

## Generate and install keys

```bash
ssh-keygen -t ed25519 -C "me@example.com"            # recommended type
ssh-keygen -t ed25519 -f ~/.ssh/id_work -C "work"    # custom file name
ssh-keygen -t rsa -b 4096                            # if ed25519 is unsupported
ssh-keygen -p -f ~/.ssh/id_ed25519                   # change the passphrase
ssh-keygen -lf ~/.ssh/id_ed25519.pub                 # show fingerprint
ssh-copy-id -i ~/.ssh/id_ed25519.pub user@host       # append key to server's authorized_keys
```

Without `ssh-copy-id`:

```bash
cat ~/.ssh/id_ed25519.pub | ssh user@host 'mkdir -p ~/.ssh && cat >> ~/.ssh/authorized_keys'
```

Use a passphrase on private keys; the agent (below) avoids retyping it.

## ssh-agent

Holds decrypted keys in memory for the session.

```bash
eval "$(ssh-agent -s)"            # start the agent in this shell
ssh-add ~/.ssh/id_ed25519         # load a key
ssh-add -l                        # list loaded keys
ssh-add -D                        # remove all keys
```

In `~/.ssh/config`, `AddKeysToAgent yes` loads keys automatically on first use.

## ~/.ssh/config basics

Blocks start with `Host` (a name or pattern). The first matching value for each option wins, so put specific hosts before `Host *`.

```sshconfig
Host myserver
    HostName 203.0.113.10
    User deploy
    Port 2222
    IdentityFile ~/.ssh/id_work
    IdentitiesOnly yes

Host *
    ServerAliveInterval 60
    ServerAliveCountMax 3
    AddKeysToAgent yes
```

Then connect with `ssh myserver`. It also works for `scp myserver:file .`, `rsync`, and `git`.

Common options:

| Option | Meaning |
| --- | --- |
| `HostName` | Real address or DNS name |
| `User` | Login user |
| `Port` | Server port (default 22) |
| `IdentityFile` | Which private key to use |
| `IdentitiesOnly yes` | Offer only the listed key, not every agent key |
| `ServerAliveInterval` | Send keepalive every N seconds (prevents idle drops) |
| `ForwardAgent yes` | Forward your agent to the remote host (use only on trusted hosts) |
| `StrictHostKeyChecking` | `ask` (default), `yes`, `accept-new`, `no` |
| `Compression yes` | Compress traffic on slow links |
| `Include` | Pull in other config files, e.g. `Include ~/.ssh/config.d/*` |

Wildcards and patterns: `Host *.example.com`, `Host dev-* staging-*`, `Host * !bastion`.

## Jump hosts (bastion)

```sshconfig
Host bastion
    HostName bastion.example.com
    User admin

Host internal
    HostName 10.0.0.5
    User deploy
    ProxyJump bastion
```

One-off: `ssh -J admin@bastion.example.com deploy@10.0.0.5`.

## Port forwarding (tunnels)

```bash
ssh -L 5433:localhost:5432 user@host     # local: localhost:5433 -> host's Postgres 5432
ssh -R 8080:localhost:3000 user@host     # remote: host:8080 -> your local port 3000
ssh -D 1080 user@host                    # dynamic SOCKS proxy on localhost:1080
ssh -N -f -L 5433:localhost:5432 user@host   # no shell (-N), background (-f)
```

In config: `LocalForward 5433 localhost:5432`, `RemoteForward`, `DynamicForward`.

## Connection multiplexing (faster repeat connections)

```sshconfig
Host *
    ControlMaster auto
    ControlPath ~/.ssh/cm-%r@%h:%p
    ControlPersist 10m
```

Later sessions to the same host reuse one connection. Check or close it: `ssh -O check host`, `ssh -O exit host`.

## Multiple GitHub accounts via SSH

Use one host alias per account, each with its own key:

```sshconfig
Host github-personal
    HostName github.com
    User git
    IdentityFile ~/.ssh/id_personal
    IdentitiesOnly yes

Host github-work
    HostName github.com
    User git
    IdentityFile ~/.ssh/id_work
    IdentitiesOnly yes
```

Add each `.pub` key to the matching GitHub account, then use the alias in the remote URL:

```bash
git clone git@github-work:org/repo.git
git remote set-url origin git@github-personal:me/repo.git
ssh -T git@github-personal               # test: "Hi <user>! You've successfully authenticated"
```

This avoids the HTTPS "wrong account active" problem (see `gh auth switch`). To switch a repo from HTTPS to SSH: `git remote set-url origin git@github.com:owner/repo.git`.

## Server configuration (/etc/ssh/sshd_config)

Typical hardening:

```
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
AllowUsers deploy admin
Port 2222
```

Apply changes safely:

```bash
sudo sshd -t                        # validate syntax first
sudo systemctl reload sshd          # (service name is `ssh` on Debian/Ubuntu)
```

Keep a second session open while testing, so a bad config does not lock you out. If you change `Port`, allow it in the firewall first.

## Debugging

```bash
ssh -v user@host                    # verbose; -vv / -vvv for more detail
ssh -G myserver                     # print the effective config for a host
ssh -T git@github.com               # test auth without opening a shell
ssh-keygen -R host                  # remove a stale host key from known_hosts
ssh-keyscan -H host >> ~/.ssh/known_hosts   # pre-fill a host key
sudo journalctl -u ssh -f           # server-side log (Debian/Ubuntu); `sshd` on RHEL
```

## Gotchas

- "Permissions are too open" means key or `.ssh` modes are wrong; see the chmod list above.
- "WARNING: REMOTE HOST IDENTIFICATION HAS CHANGED" can mean a reinstalled server, or a man-in-the-middle. Verify before running `ssh-keygen -R`.
- Without `IdentitiesOnly yes`, ssh tries every agent key and can hit the server's `MaxAuthTries` limit before the right one.
- `ForwardAgent yes` lets root on the remote host use your keys while connected. Prefer `ProxyJump`.
- Config option names are case-insensitive, but values such as file paths are not. On Windows, `~/.ssh` is `C:\Users\<name>\.ssh`.
