# Step 10 (שלב 10) — SSH and Secure Communication

Stage B. Goal: log in to your own VM with a key, then harden the SSH server.

Full reference: `raw/linux/ssh-config.md`.

## Learn

- Key pair: private key stays with you, public key goes into the server's `~/.ssh/authorized_keys`.
- First connection: verify the host key fingerprint, stored in `known_hosts`.
- Client config: `~/.ssh/config`. Server config: `/etc/ssh/sshd_config`.
- Permissions: `~/.ssh` 700, private key 600.

## Guided exercise

1. On your machine: `ssh-keygen -t ed25519 -f ~/.ssh/id_lab -C "lab"`.
2. Copy it to the VM: `ssh-copy-id -i ~/.ssh/id_lab.pub user@192.168.56.101`.
3. Add a client entry:
   ```sshconfig
   Host lab
       HostName 192.168.56.101
       User user
       IdentityFile ~/.ssh/id_lab
       IdentitiesOnly yes
   ```
   Then `ssh lab`.
4. Harden the server (keep a second session open):
   ```
   PasswordAuthentication no
   PermitRootLogin no
   ```
   Validate and reload: `sudo sshd -t && sudo systemctl reload ssh`.
5. Test from a new terminal that key login works and password login is refused: `ssh -o PubkeyAuthentication=no user@192.168.56.101`.

## What good looks like

- Password login is refused, key login works, root login is refused.
- You can read `ssh -v` output to see which key was offered.

## Pitfalls

- Changing `sshd_config` without a second open session can lock you out.
- Wrong permissions on `~/.ssh` make the server ignore your key.
- The service is `ssh` on Debian/Ubuntu and `sshd` on RHEL.

## Daily summary prompts

Describe the login sequence: host key check, key offer, challenge, session.

## Review questions

1. What does `ssh-copy-id` change on the server?
2. Why test a new SSH config before closing the old session?
3. What does `IdentitiesOnly yes` prevent?
