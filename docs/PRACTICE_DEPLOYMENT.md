# Practice homepage deployment

The existing Next.js project serves the practice calendar at `/`. Older journal routes remain intact. No Sites manifest or Worker build is used here. Kinematics remains excluded.

Set production environment variables in the connected Vercel project, then redeploy:

- CALENDAR_CODE: the user-selected entry code.
- CALENDAR_SESSION_SECRET: a cryptographically random secret of at least 32 bytes.

Never commit either value. Missing configuration fails closed with HTTP 503 on login. The short code is a convenience gate, not suitable protection for medical records. No medical records are included. Completion data stays on the user's device.

TEST_URL and TEST_CODE configure `node test-access.mjs` for integration checks.
