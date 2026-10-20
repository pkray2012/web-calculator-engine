# Audit branch handoff

Published audit folder: audits/home-energy-20261020/
Branch: audit/home-energy-20261020
Baseline: 098571906afd98b0fdf04ad6a57f784cd8ea8db8 (claude/compassionate-dirac-cv1ipd)

Read codex-full-audit.md, then claude-correction-instructions.md. This is a partial independent audit: the seven named Claude Home Energy documents and two original reference files were unavailable. It does not approve implementation or releases.

The original audit package files and SHA256SUMS are preserved unchanged. Absolute /workspace and /home/user paths in reports/JSON are captured VM evidence, not paths guaranteed to exist in Claude's checkout. Installed dependencies, caches, generated application assets and the expanded source export are excluded. The original evidence/repository.tar.gz preserves the exact verified baseline if an isolated reproduction is needed. Follow the recorded commands in a separate scratch directory, adapt historical input paths explicitly, and keep the actual application checkout untouched during review.

Fresh recorded results: 681baseline unit tests; 114browser tests on the successful repeat; lint/typecheck/build/site audits pass; 25synthetic arithmetic illustrations. The initial browser wrapper timeout remains recorded and superseded by the successful longer repeat. These are not tests of absent Home Energy implementations or Claude's missing original vectors.

Claude can fetch without switching its working branch:

```sh
git fetch origin audit/home-energy-20261020
git show origin/audit/home-energy-20261020:audits/home-energy-20261020/claude-correction-instructions.md
```

To copy only these documents into an isolated review directory, use git archive against the fetched ref rather than merging application code. No merge, implementation, deployment or production change is authorized by this audit publication. Publication does not confirm that Claude has fetched or read the branch.
