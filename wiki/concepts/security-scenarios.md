# Advanced Security Scenarios

## Definition
Ten defensive, lab-based scenarios that combine the cyber-linux commands: each has a situation, an investigation path, what to look for and a response.

## Mental Model
Simulate the event in your isolated lab first, then investigate it. The shared method is the same every time: preserve evidence, collect, build a timeline, contain with something you can undo, then fix.

## Example
| # | Scenario | Page |
| --- | --- | --- |
| 1 | SSH brute force, then a successful login | [[log-investigation]], [[incident-response]] |
| 2 | Persistence hunt after a suspicious login | [[persistence-mechanisms]] |
| 3 | Privilege-escalation surface audit | [[suid-and-capabilities]] |
| 4 | Unexpected listener or outbound connection | [[suspicious-connections]] |
| 5 | Web log shows probing | [[web-log-analysis]] |
| 6 | Rogue user or hidden account | [[rogue-accounts]] |
| 7 | Modified system files | [[file-integrity]] |
| 8 | Sudden mass file changes | [[mass-file-changes]] |
| 9 | Lateral movement review over SSH | [[lateral-movement-review]] |
| 10 | Full assessment drill | [[security-assessment-report]] |

Habits for every scenario: preserve and hash evidence before cleanup; work in UTC; change one thing at a time and keep a second SSH session open; prefer undoable containment (lock, block, snapshot) over deletion; state what you do not know.

## Related Concepts
- [[cyber-learning-path]]
- [[incident-response]]
- [[log-investigation]]
- [[persistence-mechanisms]]
- [[suid-and-capabilities]]
- [[suspicious-connections]]
- [[web-log-analysis]]
- [[rogue-accounts]]
- [[file-integrity]]
- [[mass-file-changes]]
- [[lateral-movement-review]]
- [[security-assessment-report]]
- [[cyber-command-reference]]
- [[cyber-lab]]

## Sources
- [[raw/linux/cyber-scenarios.md]]
