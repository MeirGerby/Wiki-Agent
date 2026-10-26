# Step 7 (שלב 7) — Network Tools on Linux

Stage B. Goal: inspect your own machine's network state and find which ports are open for listening.

## Learn

| Tool | Question it answers |
| --- | --- |
| `ip a`, `ip route` | What addresses and routes do I have? |
| `ss -tulpn` | Which ports listen, and which program owns each? |
| `ping` | Is the host reachable (ICMP)? |
| `traceroute` / `tracepath` | Which hops are on the path? |
| `dig` | What does DNS say? |
| `curl -v` | What happens in an HTTP(S) request? |

## Guided exercise

1. `ss -tulpn` and make a table: port, protocol, address (`127.0.0.1` vs `0.0.0.0`), program.
2. For each `0.0.0.0` or `[::]` listener, decide: is it needed? Who can reach it?
3. Start a test listener and find it: `python3 -m http.server 8000 --bind 127.0.0.1`, then `ss -tulpn | grep 8000`. Stop it.
4. Ask DNS directly: `dig @1.1.1.1 example.com A +short` and compare with your resolver's answer.
5. `curl -v https://example.com -o /dev/null` and mark the TLS and HTTP lines.

## What good looks like

- You can tell "listening on localhost only" from "listening on all interfaces".
- You can name the program behind each open port.

## Pitfalls

- `ss` needs `sudo` to show process names for other users.
- `ping` failing does not mean the host is down; ICMP is often filtered.

## Daily summary prompts

Paste your port table and note anything you did not expect.

## Review questions

1. What is the difference between `127.0.0.1` and `0.0.0.0` as a bind address?
2. What does `-tulpn` stand for?
3. Why can ping fail while a website works?
