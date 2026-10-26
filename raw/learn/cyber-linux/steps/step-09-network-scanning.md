# Step 9 (שלב 9) — Network Scanning with Nmap

Stage B. Goal: identify hosts, open ports and services on a machine you own.

Scan only hosts you own or have written permission to test.

## Learn

- Host discovery: `nmap -sn NETWORK/CIDR`.
- Port states: `open`, `closed`, `filtered` (dropped by a firewall), `open|filtered`.
- Service detection: `-sV`. Default scripts: `-sC`. Output: `-oN file`, `-oX file`.
- Scan types: TCP connect (`-sT`, no root), SYN (`-sS`, root), UDP (`-sU`, slow).

## Guided exercise

1. Scan yourself: `nmap 127.0.0.1`. Compare with `ss -tulpn`. They should agree.
2. Start a test service (`python3 -m http.server 8000 --bind 127.0.0.1`) and scan again: `nmap -p 8000 -sV 127.0.0.1`.
3. In your lab (step 16), scan the target VM: `nmap -sn 192.168.56.0/24`, then `nmap -sV -p- 192.168.56.101 -oN target.txt`.
4. Turn the firewall on in the target (step 12) and scan again. Which ports changed from `open` to `filtered`?
5. Write a table: port, state, service, version, "needed?".

## What good looks like

- Scan results match what `ss` shows on the target.
- You can explain every `open` port or mark it for review.

## Pitfalls

- `-p-` scans all 65535 ports and takes longer.
- Version detection can be wrong; confirm on the host.
- Scanning is noisy; on a real network it can trigger alerts and may be illegal without permission.

## Daily summary prompts

List the services you found and which ones you would close.

## Review questions

1. What is the difference between `closed` and `filtered`?
2. Why compare an Nmap scan with `ss` on the same host?
3. Why is UDP scanning slower?
