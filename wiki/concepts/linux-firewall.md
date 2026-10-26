# Linux Firewall (ufw / nftables)

## Definition
Rules that allow or block network traffic on a host. `ufw` is the simple front end; `nftables` is the layer beneath.

## Mental Model
Least privilege: deny by default, allow only what is needed. Keep a second session open when changing SSH rules so you cannot lock yourself out.

## Example
```bash
sudo ufw default deny incoming
sudo ufw allow from 192.168.56.0/24 to any port 22 proto tcp
sudo ufw enable
```
Verify with a scan from another lab machine.

## Guided Practice
- Allow SSH from the lab network, allow the lab service from the attacker VM only, enable, then scan: expected 22 and 8000 open, 8080 filtered.
- Delete a rule with `sudo ufw delete N` and rescan to confirm.
- Docker can bypass `ufw` with its own rules; IPv6 needs its own rules.

## Related Concepts
- [[network-scanning]]
- [[network-fundamentals]]
- [[system-hardening]]
- [[ssh-tunnels]]
- [[cyber-learning-path]]
- [[suspicious-connections]]
- [[lateral-movement-review]]

## Sources
- [[raw/learn/cyber-linux/stage-c-linux-security.md]]
- [[raw/learn/cyber-linux/steps/step-12-firewall.md]]
