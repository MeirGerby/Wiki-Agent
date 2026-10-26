# Stage B (שלב ב׳) — Networking and Communication

Steps 6-10 of the Linux cyber learning path. Goal: understand how machines talk, and inspect that traffic on your own lab.

Scan and capture only on machines and networks you own or are explicitly allowed to test.

## 6. Networking fundamentals

- **IP address and netmask**: `192.168.1.10/24` means the first 24 bits are the network; 254 usable hosts.
- **Default gateway**: the router used for destinations outside your network.
- **DNS**: name to IP. **TCP**: reliable, connection-based (3-way handshake SYN, SYN-ACK, ACK). **UDP**: no connection, no guarantees.
- Common ports: 22 SSH, 53 DNS, 80 HTTP, 443 HTTPS, 5432 Postgres.

Exercise: explain what happens from typing a URL to getting the page: DNS lookup, TCP handshake, TLS handshake, HTTP request, response, rendering.

## 7. Network tools on Linux

```bash
ip a; ip route               # addresses and routing table
ss -tulpn                    # listening TCP/UDP ports and their processes
ping -c 4 1.1.1.1
traceroute example.com       # hops to a destination
dig example.com A +short     # DNS query
dig @1.1.1.1 example.com MX
curl -I https://example.com  # headers only
curl -v https://example.com  # see TLS and request details
```

Exercise (step 7): list the ports your own machine listens on (`ss -tulpn`) and name the program behind each.

## 8. Traffic analysis

```bash
sudo tcpdump -i any -n port 53                # DNS only
sudo tcpdump -i any -n host 10.0.0.5 -w cap.pcap
tcpdump -r cap.pcap -nn 'tcp[tcpflags] & tcp-syn != 0'
```

Wireshark display filters: `dns`, `tcp.flags.syn==1`, `http`, `ip.addr==10.0.0.5`, `tcp.stream eq 3` (follow one conversation).

Exercise: in your lab, run `dig` and `curl`, capture them, and find the DNS query, the SYN handshake and the HTTP request in the capture.

Only capture traffic from your own lab. Captures can contain passwords and personal data.

## 9. Network scanning (Nmap)

```bash
nmap 127.0.0.1                       # step 9 exercise: your own machine
nmap -sn 192.168.56.0/24             # host discovery in your lab network
nmap -sV -p 1-1000 192.168.56.101    # service and version detection
nmap -sC -sV -oN scan.txt TARGET     # default scripts, save the result
```

Reading results: `open` (a service answers), `closed` (reachable, nothing listening), `filtered` (a firewall drops packets).

Rules: scan only hosts you own or have written permission to test. Scanning others' systems may be illegal.

## 10. SSH and secure communication

```bash
ssh-keygen -t ed25519 -C "lab"
ssh-copy-id user@lab-vm
ssh user@lab-vm
```

Learn: `~/.ssh/authorized_keys`, key vs password login, `sshd_config` hardening (`PasswordAuthentication no`, `PermitRootLogin no`).
Exercise (step 10): create a key and log in to your own VM. Full reference: [[raw/linux/ssh-config.md]].

## Self-check questions

1. Why does a `filtered` port look different from a `closed` one in a scan?
2. What does `ss -tulpn` show that `ping` cannot?
3. In a pcap, how do you tell a failed TCP connection from a successful one?
4. Why is key login safer than a password over SSH?
