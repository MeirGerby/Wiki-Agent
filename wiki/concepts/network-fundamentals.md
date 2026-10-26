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

## Guided Practice
- Write the sequence for `curl https://example.com`: DNS query, TCP handshake to 443, TLS handshake, HTTP request and response; check each with `dig` and `curl -v`.
- CIDR by hand: a `/26` has 64 addresses, 62 usable.
- Build a table of `ss -tulpn`: port, protocol, bind address, program. Decide whether each `0.0.0.0` listener is needed.
- `ping` failing does not mean the host is down; ICMP is often filtered.

## Related Concepts
- [[packet-capture]]
- [[network-scanning]]
- [[linux-firewall]]
- [[ssh]]
- [[ssh-keys-and-agent]]
- [[ssh-tunnels]]
- [[cyber-learning-path]]
- [[suspicious-connections]]

## Sources
- [[raw/learn/cyber-linux/stage-b-networking.md]]
- [[raw/learn/cyber-linux/steps/step-06-networking-fundamentals.md]]
- [[raw/learn/cyber-linux/steps/step-07-network-tools.md]]
