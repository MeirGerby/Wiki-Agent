# Lateral Movement Review (SSH)

## Definition
Checking whether a compromised host was used to reach other hosts over SSH: logins from unusual internal addresses, unexpected tunnels, agent forwarding.

## Mental Model
Follow the keys and the connections. `Accepted publickey` lines show who came from where; `ssh -L/-R/-D` processes you did not start are tunnels; `ForwardAgent` lets a remote root use your keys.

## Example
```bash
grep -E "Accepted publickey" /var/log/auth.log | awk '{print $9,$11}' | sort | uniq -c
ss -tnp | grep ":22"
ps aux | grep -E "ssh .* -[LRD]" | grep -v grep
grep -R "ForwardAgent" ~/.ssh/config /etc/ssh/ 2>/dev/null
```
Response: rotate exposed keys, remove unknown `authorized_keys` entries, use `ProxyJump` instead of `ForwardAgent`, and restrict SSH sources with `ufw`.

## Related Concepts
- [[ssh-keys-and-agent]]
- [[ssh-tunnels]]
- [[log-investigation]]
- [[linux-firewall]]
- [[incident-response]]
- [[security-scenarios]]

## Sources
- [[raw/linux/cyber-scenarios.md]]
