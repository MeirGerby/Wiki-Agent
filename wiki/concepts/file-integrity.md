# File Integrity Checking

## Definition
Detecting modified system files by comparing hashes and package manifests with known-good values.

## Mental Model
A hash is a fingerprint. Record fingerprints of key binaries right after install, then verify later; a package manager can also verify its own files (`dpkg -V`, `rpm -Va`).

## Example
```bash
sudo dpkg -V
sha256sum /usr/bin/ssh /usr/bin/sudo /bin/ls > baseline/hashes.txt
sha256sum -c baseline/hashes.txt
sudo find /usr/bin /usr/sbin /bin /sbin -xdev -mtime -3 -type f 2>/dev/null
```
Binaries changed outside a package update need an explanation. Tools such as AIDE do this at scale.

## Related Concepts
- [[incident-response]]
- [[system-hardening]]
- [[persistence-mechanisms]]
- [[security-scenarios]]
- [[mass-file-changes]]

## Sources
- [[raw/linux/cyber-scenarios.md]]
- [[raw/linux/cyber-commands.md]]
