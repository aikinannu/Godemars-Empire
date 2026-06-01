# Entitlement Enforcement, Licensing Validation & Playwright Coverage

## Summary
This PR improves licensing and entitlement enforcement across the platform.

### Included

- Plan → feature mapping alignment
- License issuance/introspection validation
- `RequireFeature` component integration
- Upgrade CTA support for gated features
- Playwright entitlement verification
- Screenshot artifact generation (`tests/playwright-screenshots`)
- Feature-matrix validation updates
- Test runner fixes

## Validation Performed

### License Server

- Issued Free, Pro, and Enterprise tokens
- Verified introspection responses
- Verified feature claims match configured plans

### Backend

- Registration flow passed
- Login flow passed
- Refresh flow passed
- Logout flow passed

### Frontend

- Premium navigation visibility verified
- Feature-gated routes verified
- Upgrade CTA rendering verified

### Playwright

- Visual verification completed
- Assertion suite completed successfully
- Screenshots captured and stored under `tests/playwright-screenshots`

## Entitlement Matrix

### Free
Accessible:

- Dashboard

Restricted:

- Analytics
- Integrations
- Executive Center
- Developer APIs
- Marketplace
- Other premium features

### Pro
Accessible:

- Dashboard
- Cloud Infrastructure
- CMS Studio
- Marketing Hub
- Analytics
- Integrations

Restricted:

- Enterprise-only capabilities

### Enterprise
Accessible:

- Files Vault
- Analytics
- Webhooks
- SSO
- Priority Support

## Artifacts

- Playwright screenshots (`tests/playwright-screenshots`)
- Assertion results (`tests/playwright-failures`)
- Introspection output samples (captured during local runs)

## Follow-up Work

- Complete remaining per-widget `RequireFeature` coverage
- Add CI execution for Playwright assertions
- Complete WordPress PHPUnit harness setup
- Expand entitlement regression coverage

## How to run locally

```powershell
npm ci
$env:CHROMIUM_EXECUTABLE='C:\Program Files\Google\Chrome\Application\chrome.exe'; node scripts/playwright_run.js
```

## Checklist

- Integration tests passing
- License issuance verified
- Introspection verified
- Feature matrix aligned
- Playwright assertions passing
- Screenshot artifacts generated
- CI Playwright execution
- Full WordPress PHPUnit suite
