# Step 12 (שלב 12) — Firewall

Stage C. Goal: expose a lab service on one port only, and prove it.

## Learn

- Default policy: deny incoming, allow outgoing.
- `ufw` rules: allow/deny, by port, protocol, source address, interface.
- `nftables` is the kernel-level framework `ufw` configures: tables, chains, rules.
- Order matters: first matching rule wins in many firewalls; check `ufw status numbered`.
- Principle of least privilege: open the minimum.

## Guided exercise

1. Before changing anything, keep a second SSH session open.
2. Set defaults and allow SSH from the lab network only:
   ```bash
   sudo ufw default deny incoming
   sudo ufw default allow outgoing
   sudo ufw allow from 192.168.56.0/24 to any port 22 proto tcp
   ```
3. Start a lab web service on the target (`python3 -m http.server 8000`) and allow only that port from the attacker VM:
   `sudo ufw allow from 192.168.56.102 to any port 8000 proto tcp`.
4. `sudo ufw enable`, then `sudo ufw status numbered`.
5. From the attacker VM run `nmap -p 22,8000,8080 192.168.56.101`.
   Expected: 22 and 8000 open, 8080 filtered.
6. Remove the rule with `sudo ufw delete N` and scan again to confirm.

## What good looks like

- The scan matches your rule list exactly.
- You can read `sudo nft list ruleset` and find the equivalent rules.

## Pitfalls

- Enabling `ufw` before allowing SSH can lock you out.
- Docker publishes ports through its own iptables rules and can bypass `ufw`.
- IPv6 needs its own rules unless `IPV6=yes` in `/etc/default/ufw`.

## Daily summary prompts

Write your rule table (port, source, reason) and the scan that proves it.

## Review questions

1. Why use deny-by-default instead of blocking known bad ports?
2. What does `filtered` in a scan tell you about the firewall?
3. How do you avoid locking yourself out?
