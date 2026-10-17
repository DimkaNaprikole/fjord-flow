# Public configuration and credentials

## Firebase Authentication

`chat-config.json` contains a public Firebase browser API key. It identifies
the Firebase project; it is not a service-account credential or a Gemini key.
Firebase explicitly permits publishing this configuration when appropriate API
restrictions are applied:
https://firebase.google.com/docs/projects/api-keys

The key must remain restricted to these APIs for the current implementation:

- Identity Toolkit API (`identitytoolkit.googleapis.com`)
- Token Service API (`securetoken.googleapis.com`)

Never allow Gemini / Generative Language, Maps, Places, or other unrelated APIs
on this key. Use separate, appropriately restricted keys for those services.
Restrictions live in Google Cloud and cannot be verified from this repository.
Recheck them when changing the authentication setup.

The current Cloudflare Worker also uses this Firebase key for account lookup.
Adding browser-only HTTP-referrer restrictions to the shared key can break
server verification. Separate browser/server keys before adding incompatible
application restrictions. Hiding a key in build variables does not make a key
shipped to a browser secret.

The Worker must require authentication (`AUTH_REQUIRED=true`), verify the
Firebase token with Firebase, require a verified email, and reject disabled
users. Removing the public key or disabling the authentication requirement is
not a security fix. Keep per-user limits and moderation in the Worker.

## Actual secrets

OpenAI API keys, email-provider credentials, signing secrets, service-account
private keys, GitHub tokens and refresh tokens must never enter static assets
or Git history. Store backend credentials in the provider's secret store.
Do not copy user tokens or passwords into issue reports or diagnostic output.

Run `python scripts/check-public-secrets.py` before publishing. The GitHub
workflow runs this same limited pattern check on pushes and pull requests.
It checks tracked files in the current checkout, not historical commits or
provider-side configuration, and does not replace GitHub secret scanning.

If an actual secret is exposed, revoke or rotate it at its issuer, update its
authorized consumers, verify the old credential no longer works, and inspect
usage. Deleting a file or rewriting history alone does not revoke a secret.
Only dismiss an alert for the public Firebase key after confirming its identity,
API restrictions and actual use. Do not disable repository secret scanning.

## Review on 2026-10-17

The SHA-256 fingerprint of the key in the Google Cloud console matched the key
in `chat-config.json`. Its API allowlist contained only Identity Toolkit and
Token Service. GitHub alert #1 was already closed as a false positive before
this review; no new dismissal or key rotation was performed.

The deployed Worker health endpoint reported `registration_required=true` and
`ready=true`. A request without a visitor token was rejected with HTTP 401
(`registration_required`). These checks do not establish whether any earlier
abuse occurred and are not a review of billing or complete usage history.
