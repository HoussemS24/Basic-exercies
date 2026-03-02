# Threat Model (STRIDE)
- Spoofing: SSO session cookies with secure attributes.
- Tampering: encrypted local cache and keychain secrets.
- Repudiation: structured metering events trace_id/request_id.
- Information Disclosure: scrub/redaction middleware.
- DoS: quota hard limits and retry backoff.
- Elevation of Privilege: capability map and UI approval for write operations.
Owners: Security lead, Backend lead, Desktop lead.
