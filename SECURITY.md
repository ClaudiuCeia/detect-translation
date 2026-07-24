# Security Policy

## Audit exceptions

`GHSA-mh99-v99m-4gvg` affects `brace-expansion` versions pulled in only by
Jest's development-time coverage tooling. The package has no production
dependencies, and these globs never process untrusted application input.

The advisory currently has no compatible patch for the 1.x and 2.x lines used
by Jest's transitive dependencies. The audit exception should be removed when
those lines receive backports or Jest no longer requires them.
