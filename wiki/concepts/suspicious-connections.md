# Suspicious Listeners and Connections

## Definition
Finding a port nobody installed or a host talking to an unknown address, and tracing it to a process.

## Mental Model
Start from the socket and walk to the program: `ss` shows the port and PID, `/proc/PID/exe` shows the real binary, `sha256sum` fingerprints it. A binary running from `/tmp` or marked `(deleted)` is a strong signal.

## Example
```bash
sudo ss -tulpn
sudo ss -tnp state established
ls -l /proc/PID/exe; cat /proc/PID/cmdline | tr '\0' ' '
sha256sum /proc/PID/exe
sudo tcpdump -i any -n host 203.0.113.9 -w conn.pcap -c 200
```
Response: copy evidence first, then `ufw deny out to 203.0.113.9`, stop the service, and trace how it started (systemd unit, cron, user login).

## Related Concepts
- [[network-fundamentals]]
- [[packet-capture]]
- [[linux-firewall]]
- [[linux-processes-services]]
- [[incident-response]]
- [[security-scenarios]]

## Sources
- [[raw/linux/cyber-scenarios.md]]
