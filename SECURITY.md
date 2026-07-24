# Security Policy

## Supported versions

Only the latest version published to npm receives security updates. Older
versions are not supported.

## Reporting a vulnerability

Please do not report suspected vulnerabilities in a public issue. Use
[GitHub's private vulnerability reporting form](https://github.com/ClaudiuCeia/detect-translation/security/advisories/new).

Include the affected version, impact, reproduction steps or a minimal proof of
concept, and any known mitigations. You should receive an acknowledgement
within seven days. We will confirm whether the report is accepted, coordinate
remediation and disclosure, and credit reporters unless anonymity is
requested. Please keep the report private until a fix or advisory is published.

## Audit exceptions

`GHSA-mh99-v99m-4gvg` affects `brace-expansion` versions pulled in only by
Jest's development-time coverage tooling. The package has no production
dependencies, and these globs never process untrusted application input.

The advisory currently has no compatible patch for the 1.x and 2.x lines used
by Jest's transitive dependencies. The audit exception should be removed when
those lines receive backports or Jest no longer requires them.
