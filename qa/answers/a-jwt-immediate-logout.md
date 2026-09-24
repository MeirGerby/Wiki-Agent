---
id: a-jwt-immediate-logout
question: q-jwt-immediate-logout
concepts:
  - jwt-authentication
  - jarvis-permissions
origin: generated
---

# You cannot, without giving up statelessness somewhere

## Short answer

A signed token is valid until it expires, by design -- that is what removes the database lookup. Immediate revocation means reintroducing state.

## Why it is hard

Validation is a signature check against a secret. The server consults nothing, so
it has nothing to consult in order to learn that a token was revoked.

## The usual options

- **Short-lived access token + refresh token.** Access token lives minutes;
  revoke by refusing to refresh. Revocation is delayed by the access token's
  lifetime, which is the lever you tune.
- **Revocation list.** Keep revoked token IDs in a store and check on each
  request. Correct and immediate, but you have put the database lookup back.
- **Clear the cookie only.** Fine for "log me out on this device". Does nothing
  against a token already copied elsewhere.

## In Jarvis

The token is set as an HTTP-only cookie, so page JavaScript cannot read it and
XSS cannot exfiltrate it. That limits exposure, but it does not make an issued
token revocable.

## Sources

- [[raw/jarvis/BFF-ARCHITECTURE.md]]
- [[raw/jarvis/apps/model-catalog/bff/src/utils/jwt.ts]]

Refresh-token rotation and revocation lists are general knowledge, not drawn from
the Jarvis sources. Jarvis's own token handling is what the sources above cover.

## Question

- [[q-jwt-immediate-logout]]

## Related Concepts

- [[jwt-authentication]]
- [[jarvis-permissions]]
