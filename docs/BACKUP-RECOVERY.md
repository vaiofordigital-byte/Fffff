# Backup and recovery

## What to back up

- MySQL: encrypted full backups plus point-in-time binary logs.
- Uploaded media: versioned private object storage; this repository does not expose a public upload bucket.
- Configuration: encrypted hosting-variable export, payment webhook configuration and DNS/TLS records.
- Source and migrations: protected Git repository and immutable release artifacts.

Never place database dumps, environment files or media backups under the public web root.

## Schedule and retention

Use daily full database backups with continuous binary-log retention. Maintain at least one encrypted copy in a separate failure domain. Define exact retention according to merchant, tax and privacy obligations.

## Restore procedure

1. Declare the recovery point and stop writes.
2. Provision an isolated replacement database.
3. Verify backup checksums, decrypt and restore the selected full backup.
4. Replay binary logs to the approved recovery point.
5. Run `npm run db:deploy` using the matching release.
6. Validate order/payment/entitlement and credit-ledger consistency.
7. Restore private media and verify access controls.
8. Point staging at the restored system and complete smoke tests.
9. Switch production traffic only after sign-off and record the event in the incident log.

Perform and document restore drills. A backup is not considered valid until a restore has been tested.
