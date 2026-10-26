# Step 8 (שלב 8) — Network Traffic Analysis

Stage B. Goal: capture DNS and TCP traffic that you create yourself in a lab, then read it.

Capture only your own traffic. Captures can contain passwords and personal data.

## Learn

- `tcpdump` for quick capture on the command line; Wireshark for reading.
- Capture filters (BPF) limit what is recorded: `port 53`, `host 10.0.0.5`, `tcp`.
- Display filters (Wireshark) limit what is shown: `dns`, `tcp.flags.syn==1`, `http`, `tcp.stream eq N`.
- TCP flags: SYN, SYN-ACK, ACK, FIN, RST (reset = refused or aborted).

## Guided exercise

1. Capture in one terminal: `sudo tcpdump -i any -n -w lab.pcap 'port 53 or port 80'`.
2. In another terminal generate traffic: `dig example.com`, `curl http://example.com`.
3. Stop the capture (Ctrl+C) and open `lab.pcap` in Wireshark, or read it: `tcpdump -nn -r lab.pcap`.
4. Find and write down:
   - the DNS query and its answer (record type, IP, TTL)
   - the three handshake packets
   - the HTTP request line and the response status
5. Provoke a reset: `curl http://127.0.0.1:9` (nothing listening). Find the RST packet.

## What good looks like

- You can follow one conversation start to end (`Follow TCP stream`).
- You can tell a successful connection (SYN, SYN-ACK, ACK) from a refused one (SYN, RST).

## Pitfalls

- HTTPS payloads are encrypted; use plain HTTP in the lab for reading content.
- Capturing on the wrong interface gives an empty file; check with `ip a`.
- Keep capture files private and delete them when done.

## Daily summary prompts

Write the packet sequence for your `curl` request, one line per packet.

## Review questions

1. What is the difference between a capture filter and a display filter?
2. How does a closed port answer a SYN?
3. Why can you not read the content of an HTTPS capture?
