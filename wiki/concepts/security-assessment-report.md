# Security Assessment Report

## Definition
The capstone deliverable: a Markdown report on one machine you own, with findings, risk, evidence and fixes.

## Mental Model
Four steps feed it: map services, check permissions, analyse logs, recommend fixes. Every finding needs evidence (command output or a log line), and risk comes from impact and likelihood.

## Example
```markdown
# Security Assessment: <machine>
## Summary
## Findings
| # | Finding | Risk | Evidence | Fix |
## Remediation plan (ordered by risk)
```

## Guided Practice
- Method: map services (`nmap -sV -p-` and `ss -tulpn`, which should agree), check permissions, analyse logs, run the hardening checklist and persistence diff, recommend fixes.
- Start the report with scope and authorization; rate risk as impact x likelihood; add a retest after fixes.
- Avoid opinions without evidence and rating everything High.

## Advanced Scenario
Scenario 10, a repeatable evidence run (every finding points at a file in `evidence/`):
```bash
mkdir -p evidence && cd evidence
nmap -sV -p- TARGET -oN nmap.txt
sudo ss -tulpn > ss.txt
find / -xdev \( -perm -4000 -o -perm -2000 \) -type f 2>/dev/null > suid.txt
sudo sshd -T | grep -Ei "permitrootlogin|passwordauthentication" > sshd.txt
sha256sum * > SHA256SUMS
```

## Related Concepts
- [[network-scanning]]
- [[suid-and-capabilities]]
- [[system-hardening]]
- [[incident-response]]
- [[web-security]]
- [[cyber-lab]]
- [[cyber-learning-path]]
- [[security-scenarios]]

## Sources
- [[raw/learn/cyber-linux/stage-d-security-practice.md]]
- [[raw/learn/cyber-linux/steps/step-20-capstone.md]]
- [[raw/linux/cyber-scenarios.md]]
