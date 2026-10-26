# Web Security (OWASP Top 10)

## Definition
Common web weaknesses and their defences, based on HTTP, cookies, sessions and the OWASP Top 10.

## Mental Model
Injection means input becomes part of a query or page. SQL injection is stopped by parameterised queries; XSS by output encoding, Content-Security-Policy and `HttpOnly` cookies. For each weakness, write the cause and the fix.

## Example
Practice locally with OWASP Juice Shop, bound to localhost:
```bash
docker run --rm -p 127.0.0.1:3000:3000 bkimminich/juice-shop
```

## Related Concepts
- [[cyber-lab]]
- [[security-assessment-report]]
- [[cyber-learning-path]]

## Sources
- [[raw/learn/cyber-linux/stage-d-security-practice.md]]
