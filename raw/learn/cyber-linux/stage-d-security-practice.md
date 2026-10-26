# Stage D (שלב ד׳) — Tools and Cyber Practice

Steps 16-20 of the Linux cyber learning path. Goal: build a legal lab, use common tools, and finish with a written security assessment of a machine you own.

**Authorization comes first.** Test only systems you own or have explicit written permission to test. Keep the lab isolated from the internet and from other people's networks.

## 16. Building a cyber lab

- Hypervisor: VirtualBox, VMware or KVM.
- Network: **host-only** or **internal** network, so VMs cannot reach the internet or your home LAN.
- Machines: an attacker VM (Kali Linux), and a target VM (an Ubuntu server you configure, or an intentionally vulnerable training VM).
- Snapshots: take one after setup so you can restore after every experiment.

```bash
VBoxManage snapshot "target" take "clean-install"
VBoxManage snapshot "target" restore "clean-install"
```

Exercise: two VMs on an isolated network that can ping each other and nothing else. Verify with `ping 8.8.8.8` failing from both.

## 17. Kali Linux tools

| Tool | Does | Limit |
| --- | --- | --- |
| Nmap | Finds hosts, ports, service versions | Shows what answers, not whether it is vulnerable |
| Wireshark | Captures and decodes traffic | Encrypted payloads stay unreadable |
| Burp Suite | Intercepts and edits web requests | Needs manual judgement; scanners miss logic flaws |

Exercise: for each tool, write what it does, when to use it, and where it falls short.

## 18. Web security

Learn HTTP (methods, status codes, headers), cookies and sessions, then the **OWASP Top 10** (e.g. broken access control, injection, cryptographic failures, security misconfiguration).

- **SQL injection**: user input becomes part of a query. Defence: parameterised queries.
- **XSS**: attacker-supplied script runs in another user's browser. Defence: output encoding, Content-Security-Policy, `HttpOnly` cookies.

Lab: run OWASP Juice Shop locally.

```bash
docker run --rm -p 127.0.0.1:3000:3000 bkimminich/juice-shop
```

Bind to `127.0.0.1` so it is not reachable from other machines. For each vulnerability you find, write down the cause and the fix.

## 19. Incident detection and response

Order of work:

1. **Preserve**: copy logs before changing anything; note the time and who did what.
2. **Collect**: logs, `ps aux`, `ss -tulpn`, `last`, cron and systemd units.
3. **Timeline**: put events in time order (first suspicious login, new files, new tasks).
4. **Hash**: `sha256sum suspicious-file` to record and compare file identity.
5. **Contain and fix**, then report.

```bash
sha256sum /usr/bin/ssh
sudo find / -xdev -newermt "2026-10-01" -type f 2>/dev/null | head
sudo journalctl --since "2026-10-25 20:00" --until "2026-10-25 23:00"
```

Exercise: investigate a made-up suspicious-login scenario (for example a log with many failures then one success from the same IP) and write a findings report.

## 20. Capstone project

Security assessment of **one machine you own**. Steps:

1. **Map services**: `nmap -sV` and `ss -tulpn`.
2. **Check permissions**: SUID files, sudo rules, world-writable files, SSH config.
3. **Analyse logs**: failed logins, unusual times, new accounts.
4. **Recommend fixes**.

Deliverable: a report in Markdown.

```markdown
# Security Assessment: <machine>
Date, scope, authorization (owner = me)

## Summary
## Findings
| # | Finding | Risk (High/Med/Low) | Evidence | Fix |
|---|---------|---------------------|----------|-----|
## Evidence (commands and output)
## Remediation plan (ordered by risk)
```

Rate risk by impact and likelihood. Every finding needs evidence (command output or a log line), not just an opinion.

## Study routine (from the path)

45-60 minutes a day: 10 min concept, 25 min commands and practice, 10 min short Markdown summary, 5 min review questions without looking at the summary.

## Self-check questions

1. Why use a host-only network for the lab?
2. What does Burp Suite show that Nmap cannot?
3. Why preserve logs before cleaning up an incident?
4. What makes a finding in your report "evidence-based"?
