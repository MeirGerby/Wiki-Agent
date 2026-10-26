# Cyber Lab

## Definition
An isolated environment of virtual machines for safe practice: an attacker VM (e.g. Kali), a target VM, a host-only or internal network, and snapshots.

## Mental Model
Isolation is the safety rule: the lab cannot reach the internet or your home network, so a mistake cannot hurt anyone. Snapshots let you undo every experiment.

## Example
```bash
VBoxManage snapshot "target" take "clean-install"
VBoxManage snapshot "target" restore "clean-install"
```
Check isolation: `ping 8.8.8.8` should fail from both VMs. Kali tools: Nmap (what answers), Wireshark (traffic; encrypted payloads stay unreadable), Burp Suite (web requests; scanners miss logic flaws).

## Related Concepts
- [[network-scanning]]
- [[packet-capture]]
- [[web-security]]
- [[security-assessment-report]]
- [[cyber-learning-path]]

## Sources
- [[raw/learn/cyber-linux/stage-d-security-practice.md]]
