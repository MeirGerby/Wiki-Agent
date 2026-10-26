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

## Guided Practice
- Host-only network, attacker VM at `192.168.56.102`, target at `192.168.56.101`, each with only the host-only adapter.
- Prove isolation: `ping` between the VMs works, `ping 8.8.8.8` fails from both. A second NAT or bridged adapter defeats isolation.
- Snapshot both VMs, break something, restore, confirm. Disable shared folders and clipboard for vulnerable VMs.

## Related Concepts
- [[network-scanning]]
- [[packet-capture]]
- [[web-security]]
- [[security-assessment-report]]
- [[cyber-learning-path]]
- [[kali-tools]]
- [[security-scenarios]]
- [[mass-file-changes]]

## Sources
- [[raw/learn/cyber-linux/stage-d-security-practice.md]]
- [[raw/learn/cyber-linux/steps/step-16-cyber-lab.md]]
