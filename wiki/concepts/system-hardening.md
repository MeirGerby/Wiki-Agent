# System Hardening

## Definition
Reducing a machine's attack surface: updates, fewer services, tight permissions and safe SSH settings.

## Mental Model
Every running service and every permissive setting is something to defend. Hardening removes them and checks the rest against a baseline (Lynis, CIS Benchmarks).

## Example
Checklist for an Ubuntu lab machine: updates applied; unattended security updates; unused services stopped; listening ports reviewed; SSH with no root login and key auth only; no empty passwords; sudo group reviewed; firewall default deny; sensitive file permissions checked.
```bash
sudo awk -F: '$2==""' /etc/shadow     # users with empty passwords
sudo lynis audit system
```

## Related Concepts
- [[linux-firewall]]
- [[linux-permissions]]
- [[suid-and-capabilities]]
- [[persistence-mechanisms]]
- [[ssh-keys-and-agent]]
- [[security-assessment-report]]
- [[cyber-learning-path]]
- [[ssh]]

## Sources
- [[raw/learn/cyber-linux/stage-c-linux-security.md]]
