# SSH Tunnels and Jump Hosts

## Definition
Forwarding network traffic through an SSH connection (`-L`, `-R`, `-D`) and reaching internal hosts through a bastion (`ProxyJump`).

## Mental Model
A tunnel is a private pipe inside an already-authenticated connection. `-L` brings a remote service to a local port; `-R` exposes a local service on the remote host; `-D` makes a SOCKS proxy.

## Example
```bash
ssh -L 5433:localhost:5432 user@host   # local 5433 -> host's Postgres
ssh -J admin@bastion deploy@10.0.0.5     # one-off jump host
ssh -N -f -L 5433:localhost:5432 user@host
```
`ForwardAgent yes` lets root on the remote host use your keys while connected, so prefer `ProxyJump`.

## Related Concepts
- [[ssh]]
- [[ssh-keys-and-agent]]
- [[network-fundamentals]]
- [[linux-firewall]]
- [[lateral-movement-review]]

## Sources
- [[raw/linux/ssh-config.md]]
