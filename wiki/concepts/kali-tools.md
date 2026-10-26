# Kali Linux Tools

## Definition
Kali is a Debian-based distribution that bundles security tools. The core three to learn first are Nmap, Wireshark and Burp Suite.

## Mental Model
Pick the tool by the question: Nmap answers "what is open", Wireshark "what exactly crossed the wire", Burp "what does the web app send and accept". Each has a blind spot: Nmap does not prove a flaw, Wireshark cannot read HTTPS payloads, Burp scanners miss logic flaws.

## Example
One-page card per tool: the question it answers, a command run in the lab, what you saw, a limit you hit. Example against your own target VM: `nmap -sV 192.168.56.101`, capture it in Wireshark and find the SYN packets, then proxy a browser through Burp (`127.0.0.1:8080`) and replay one request in Repeater. Use only inside the lab.

## Related Concepts
- [[network-scanning]]
- [[packet-capture]]
- [[web-security]]
- [[cyber-lab]]
- [[cyber-learning-path]]

## Sources
- [[raw/learn/cyber-linux/steps/step-17-kali-tools.md]]
