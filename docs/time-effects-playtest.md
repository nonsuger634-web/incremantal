# Diversified time-tree arrival comparison

Compared commit `1089818` with the working engine after the facility-synergy and time-research changes. Each run starts from `timeCheckpoint()`, buys Time Flight, uses the existing huge-number-safe ROI facility buyer (up to 100 purchases per active visit), researches and evolves at every visit, and sleeps from 16:00 through midnight each game day. The two purchase schedules are the existing recursive and balanced time-skill priorities. Only the visit cadence and skill schedule vary.

The reported arrival time is the existing playtest's interpolated crossing estimate. “Observed” is the first simulation step that detected the final goal, so it is rounded up to the next visit. All six baseline and working runs reached the goal and passed `validateSave()` at the goal.

| Visit cadence | Strategy | Baseline estimate (h) | Working estimate (h) | Change | Detected at (Baseline → working) |
|---|---|---:|---:|---:|---:|
| 15 min | Recursive | 6.5 | 6.5 | 0% | 6.75 → 6.75 h |
| 15 min | Balanced | 24 | 24.5 | +2.08% | 24.25 → 24.75 h |
| 1 h | Recursive | 34 | 34 | 0% | 35 → 35 h |
| 1 h | Balanced | 76 | 77 | +1.32% | 77 → 78 h |
| 3 h | Recursive | 102 | 102 | 0% | 105 → 105 h |
| 3 h | Balanced | 204 | 207 | +1.47% | 207 → 208 h |

All six estimated changes are within the ±5% target used for this adjustment. The largest delay is 3 hours (1.47%) for the 3-hour balanced case. Recursive arrival estimates are unchanged. The working balanced cases each perform one extra time travel before the goal; no run showed a non-finite state or save validation failure.

Reproduce from the repository root with:

```sh
node scripts/playtest/time-effects-compare.mjs
```

The comparison runner extracts `engine.js` and `numbers.js` from commit `1089818` into a temporary directory, then runs both engines with the same playtest routine. It does not publish or modify saves.

## Early utility-first check

A separate current-engine run prioritized Permanent Technology, Cosmic Legacy and Permanent Civilization Record before production skills. With hourly visits and the same 8-hour sleep / 100-purchase schedule, technology preservation was bought after 12 hours, cosmic start after 35 hours and point preservation after 35 hours. The goal estimate was 79 hours and the final save was valid. This is a sanity check for the intentionally earlier utility branch, not a paired comparison with the old utility prerequisites.

The final point-preservation cost is 3, reduced from the initial draft's 4 so it can be bought together with cosmic start in this check. Reproduce with `node scripts/playtest/endgame.mjs --branch utility-early --interval 1h --days 14`.
