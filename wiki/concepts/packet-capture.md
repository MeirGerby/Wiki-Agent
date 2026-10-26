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

## Related Concepts
- [[network-fundamentals]]
- [[network-scanning]]
- [[cyber-lab]]
- [[cyber-learning-path]]

## Sources
- [[raw/learn/cyber-linux/stage-b-networking.md]]
