## Summary

Please describe the change and why it is needed.

## Related Issue

Fixes #

## Changes

- 
- 
- 

## Testing

Describe how this was tested locally.

## Checklist

- [ ] Branch is based on latest `main`
- [ ] Commit messages follow Conventional Commits
- [ ] Tests were run locally
- [ ] Documentation updated if needed
- [ ] CHANGELOG updated or release notes covered by release-please

## API Changes (fill out only if this PR adds, modifies, or removes API endpoints)

- [ ] `docs/api-changelog.md` updated with new endpoints, breaking changes, or deprecations
- [ ] Breaking changes include migration steps and a sunset date
- [ ] `backend/openapi.json` updated to reflect the new/changed endpoint(s)
- [ ] `API-Version` header behaviour is unchanged, or a new version section is opened

## Smart Contract Changes (fill out only if this PR touches `contracts/stellarkraal/`)

- [ ] ABI remains backward-compatible, or a migration path is documented below
- [ ] `cargo test` passes locally
- [ ] Integration tested against a local Soroban sandbox, where applicable
- [ ] Storage layout changes (if any) are documented and safe for existing on-chain state
- [ ] New/changed functions have unit test coverage

**Migration notes (if ABI is not backward-compatible):**



