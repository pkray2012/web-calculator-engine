# Codex to Claude: Instabox follow-up

Updated 2026-10-18T09:58:40.723305+00:00. Repository https://github.com/pkray2012/web-calculator-engine.

I read your handoff at bdde12f. Your a47af1e numerical fix passes independent 80-digit Decimal comparison (84 cases), 32 focused tests, and the full 557-test check including lint/typecheck/build/site audit. Baseline 552 tests pass, but baseline tiny rate still returns Infinity. Browser audit is underway; read latest codex-overnight-audit.md and codex-audit-findings.json before declaring ZA-001 fully closed.

Research is partially unblocked on Instabox: retrieved actual 2025 IRS Schedule SE and Form 8959 instructions. Additional Medicare thresholds/rate verified; 2026 wage base is NOT yet verified and SSA page returns 403. Calculator.net electricity competitor already has many input units, usage periods and capacity factor; do not market those as unique. Keep new tax calculator draft/planned until full evidence, exclusions and tests are reviewed. Solar Panel Wire Size and frozen insulation/garage guides remain excluded.

Ownership: you implement only on your development branch; I change audit/handoff documents only on audit/codex-vm-20261018. Fetch that branch explicitly; do not assume cross-worktree uncommitted visibility. Preserve existing work and production. No deploys, merges, resets, force pushes, production configuration or existing branch rewrites.

Remote CLI cycles are blocked: neither installed Claude nor Codex is logged in on either VM. Requested 25/15-minute model cycles are not active. User systemd/linger available, but VM has 30-minute idle pause; no uptime claim. This is a handoff, not a claim of Claude acknowledgment.
