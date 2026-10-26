# Packet Capture

## Definition
Recording and reading network traffic with `tcpdump` and Wireshark.

## Mental Model
A capture is a recording of what crossed a network interface. Filters narrow it to one conversation. Captures can contain passwords and personal data, so only capture your own lab.

## Example
```bash
sudo tcpdump -i any -n port 53
sudo tcpdump -i any -n host 10.0.0.5 -w cap.pcap
```
Wireshark filters: `dns`, `tcp.flags.syn==1`, `tcp.stream eq 3`.

## Guided Practice
- Capture your own traffic: `sudo tcpdump -i any -n -w lab.pcap 'port 53 or port 80'`, run `dig` and `curl`, then read it in Wireshark.
- Find the DNS query and answer, the three handshake packets, and the HTTP request line and status.
- Provoke a reset with `curl http://127.0.0.1:9` and find the RST: a closed port answers a SYN with RST.
- HTTPS payloads are encrypted; use plain HTTP in the lab to read content.

## Related Concepts
- [[network-fundamentals]]
- [[network-scanning]]
- [[cyber-lab]]
- [[cyber-learning-path]]
- [[kali-tools]]
- [[suspicious-connections]]

## Sources
- [[raw/learn/cyber-linux/stage-b-networking.md]]
- [[raw/learn/cyber-linux/steps/step-08-traffic-analysis.md]]
