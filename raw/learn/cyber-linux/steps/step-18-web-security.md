# Step 18 (שלב 18) — Vulnerabilities and Web Security

Stage D. Goal: understand common web weaknesses and their defences using OWASP Juice Shop on your own machine.

## Learn

- HTTP: methods (GET, POST), status codes, headers (`Set-Cookie`, `Content-Security-Policy`).
- Cookies and sessions: `HttpOnly`, `Secure`, `SameSite`.
- OWASP Top 10 themes: broken access control, cryptographic failures, injection, insecure design, security misconfiguration, vulnerable components, authentication failures.
- **SQL injection**: input becomes part of a query. Defence: parameterised queries.
- **XSS**: attacker script runs in another user's browser. Defence: output encoding, CSP, `HttpOnly` cookies.

## Guided exercise

1. Run Juice Shop bound to localhost only:
   `docker run --rm -p 127.0.0.1:3000:3000 bkimminich/juice-shop`
2. Open `http://127.0.0.1:3000`. Use browser dev tools to inspect requests and cookies.
3. Pick three challenges from the Juice Shop score board (for example one each from injection, XSS, broken access control).
4. For each, fill this table:

   | Challenge | Weakness | Cause in the code/design | Fix |
   | --- | --- | --- | --- |
   | | | | |

5. Write the secure version in words or a short snippet, such as the parameterised query that would replace string concatenation.

## What good looks like

- You can explain the root cause, not only the trick.
- Each finding has a defence you could implement.

## Pitfalls

- Never point these techniques at sites you do not own.
- Binding Juice Shop to `0.0.0.0` exposes a deliberately vulnerable app to your network.
- Hints and write-ups can spoil learning; try first.

## Daily summary prompts

For each weakness: one sentence on cause, one on fix.

## Review questions

1. Why do parameterised queries stop SQL injection?
2. What does `HttpOnly` stop?
3. Why is broken access control hard to find with a scanner?
