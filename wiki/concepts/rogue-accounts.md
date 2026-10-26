# Rogue Accounts

## Definition
Detecting hidden or unexpected user accounts: extra UID 0 users, recently added users, unexpected shells, accounts with unknown owners.

## Mental Model
UID 0 means root, whatever the name. Compare the accounts that exist with the accounts that should exist, and check each one's login history and SSH keys.

## Example
```bash
awk -F: '$3 == 0 {print $1}' /etc/passwd
awk -F: '$3 >= 1000 {print $1,$3,$6,$7}' /etc/passwd
lastlog | grep -v Never
getent group sudo
```
Response: lock the account (`usermod -L`), record it, and remove only after you have the evidence.

## Related Concepts
- [[linux-permissions]]
- [[persistence-mechanisms]]
- [[log-investigation]]
- [[incident-response]]
- [[security-scenarios]]

## Sources
- [[raw/linux/cyber-scenarios.md]]
