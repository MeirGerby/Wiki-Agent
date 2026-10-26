# Step 6 (שלב 6) — Networking Fundamentals

Stage B. Goal: explain what happens from typing a URL to receiving the page.

## Learn

- IP address, netmask (CIDR), default gateway. `10.0.0.0/24` = 256 addresses, 254 usable hosts.
- Private ranges: `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`.
- DNS: records `A`, `AAAA`, `CNAME`, `MX`, `TXT`.
- TCP (handshake, ordered, reliable) vs UDP (fast, no guarantees).
- Ports: 22 SSH, 53 DNS, 80 HTTP, 443 HTTPS.
- Layers: link, internet, transport, application (OSI is the reference model).

## Guided exercise

1. Find your own details: `ip a`, `ip route` (gateway), `cat /etc/resolv.conf` (DNS server).
2. Do the CIDR maths by hand for `192.168.1.77/26`: network address, broadcast, first and last host. Check with `ipcalc` if installed.
3. Write the sequence for `curl https://example.com`:
   1. DNS query for the name.
   2. TCP handshake to port 443 (SYN, SYN-ACK, ACK).
   3. TLS handshake (certificate check, session keys).
   4. HTTP request, response.
   5. Connection closes or is reused.
4. Check each stage with a tool: `dig example.com`, `curl -v https://example.com`.

## What good looks like

- You can say which layer each step belongs to.
- You can explain why DNS usually uses UDP 53 and falls back to TCP.

## Pitfalls

- Mixing up the gateway (a router address) and the DNS server.
- Forgetting NAT: your private address is not what the website sees.

## Daily summary prompts

Draw the URL-to-page sequence in your own words in 10 lines.

## Review questions

1. How many hosts are in a `/26`?
2. What does the default gateway do?
3. Why is UDP used for DNS queries?
