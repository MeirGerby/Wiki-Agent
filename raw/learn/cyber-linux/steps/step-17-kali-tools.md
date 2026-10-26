# Step 17 (שלב 17) — Introduction to Kali Linux

Stage D. Goal: know what Nmap, Wireshark and Burp Suite each do, when to use them, and where they fall short.

Use them only inside your lab or on systems you have permission to test.

## Learn

| Tool | Use it to | Do not expect it to |
| --- | --- | --- |
| Nmap | discover hosts, ports and service versions | prove a service is vulnerable |
| Wireshark | see exact packets, debug protocols | read encrypted payloads |
| Burp Suite | intercept and edit web requests, replay them | find logic flaws automatically |

Kali is a Debian-based distribution that bundles security tools. It is a toolbox, not a guarantee of anything. Many tools are also on other distributions.

## Guided exercise

1. Start Kali in the lab and update it: `sudo apt update && sudo apt full-upgrade`.
2. For each tool, complete a one-page card:
   - What question does it answer?
   - One command or action you ran in your lab.
   - What you saw.
   - A limit you hit.
3. Examples to run against your target VM:
   - Nmap: `nmap -sV 192.168.56.101`
   - Wireshark: capture while running that scan and find the SYN packets.
   - Burp: proxy a browser to `127.0.0.1:8080`, open the lab web app, find one request in the history, and send it to Repeater.
4. Write a decision note: "To check X, I would use tool Y because Z."

## What good looks like

- You pick a tool by the question, not by habit.
- You can name a false positive or blind spot for each tool.

## Pitfalls

- Burp needs its CA certificate installed in the browser to inspect HTTPS; remove it afterwards.
- Running every tool on everything produces noise, not understanding.

## Daily summary prompts

Fill the three tool cards in Markdown.

## Review questions

1. Which tool answers "what ports are open"?
2. Why can Wireshark not show the content of an HTTPS request?
3. What is Burp's Repeater used for?
