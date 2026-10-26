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

## Related Concepts
- [[network-fundamentals]]
- [[packet-capture]]
- [[linux-firewall]]
- [[cyber-lab]]
- [[security-assessment-report]]
- [[cyber-learning-path]]

## Sources
- [[raw/learn/cyber-linux/stage-b-networking.md]]
- [[raw/learn/cyber-linux/stage-d-security-practice.md]]
