# Network Fundamentals

## Definition
IP addresses and netmasks, default gateway, DNS, TCP and UDP, plus the Linux tools (`ip`, `ss`, `ping`, `traceroute`, `dig`, `curl`) for inspecting them.

## Mental Model
`192.168.1.10/24` means the first 24 bits name the network. TCP is connection-based (SYN, SYN-ACK, ACK); UDP is not. Typing a URL triggers DNS, a TCP handshake, TLS, then HTTP.

## Example
```bash
ip a; ip route
ss -tulpn          # listening ports and their programs
dig example.com A +short
curl -I https://example.com
```

## Related Concepts
- [[packet-capture]]
- [[network-scanning]]
- [[linux-firewall]]
- [[ssh]]
- [[ssh-keys-and-agent]]
- [[ssh-tunnels]]
- [[cyber-learning-path]]

## Sources
- [[raw/learn/cyber-linux/stage-b-networking.md]]
