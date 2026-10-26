# Web Log Analysis

## Definition
Reading web server access logs for scanning and attack attempts: directory guessing, injection fragments, repeated login failures, path traversal.

## Mental Model
Count first, read second: rank IPs and status codes, then search for known bad fragments. One IP with many 404s is guessing paths; many 401s on `/login` is credential guessing.

## Example
```bash
awk '{print $1}' access.log | sort | uniq -c | sort -rn | head
grep -Ei "union select|' or 1=1|<script|\.\./\.\./" access.log | head
awk '{print $9}' access.log | sort | uniq -c | sort -rn
```
Response: block the source, confirm parameterised queries and output encoding, add rate limiting, and check whether any probe returned 200 with unexpected content.

## Related Concepts
- [[web-security]]
- [[log-investigation]]
- [[grep]]
- [[awk]]
- [[security-scenarios]]

## Sources
- [[raw/linux/cyber-scenarios.md]]
