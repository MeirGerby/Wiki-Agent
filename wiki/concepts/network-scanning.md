# Network Scanning (Nmap)

## Definition
Finding hosts, open ports and service versions with Nmap.

## Mental Model
A scan asks each port whether anything answers: `open` (a service answers), `closed` (reachable, nothing listening), `filtered` (a firewall drops packets). It shows what answers, not whether it is vulnerable. Scan only hosts you own or have written permission to test.

## Example
```bash
nmap 127.0.0.1
nmap -sn 192.168.56.0/24
nmap -sV -p 1-1000 192.168.56.101
```

## Guided Practice
- Scan yourself (`nmap 127.0.0.1`) and compare with `ss -tulpn`; they should agree.
- In the lab, scan the target, turn its firewall on, and scan again: which ports changed from `open` to `filtered`?
- Record a table: port, state, service, version, "needed?". Version detection can be wrong; confirm on the host.

## Related Concepts
- [[network-fundamentals]]
- [[packet-capture]]
- [[linux-firewall]]
- [[cyber-lab]]
- [[security-assessment-report]]
- [[cyber-learning-path]]
- [[kali-tools]]

## Sources
- [[raw/learn/cyber-linux/stage-b-networking.md]]
- [[raw/learn/cyber-linux/stage-d-security-practice.md]]
- [[raw/learn/cyber-linux/steps/step-09-network-scanning.md]]
