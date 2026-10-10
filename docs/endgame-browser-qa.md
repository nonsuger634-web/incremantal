# v9 browser QA: endgame and time skills

QA ran against the exported `index.html` and standalone `play.html` at `http://localhost:3000` with Chromium/Playwright. Tested 1440×900, 390×844, and 390×667. Browser scripts and screenshots are under `/tmp`; no game source files were changed.

## Results

- The time tree displays all 11 skills, including the 124-level Time Recursion branch, selected-node requirements/effects, and 13 prerequisite connections. Both exports had no JavaScript exceptions or horizontal overflow. Document width matched the viewport; chronology-panel scroll width matched its client width (657 px desktop, 364 px mobile), and tree width matched its client width (629 px desktop, 342 px mobile).
- The initial straight connection paths crossed unrelated cards: the 1→4 and 2→5 edges passed behind the wide Time Recursion card, while 3→7 and 6→7 passed through later central cards. The current export routes those four edges around the side gutters. At all tested widths, the routes remain within the panel and no longer cross skill cards. The gutters are visible as side rails, but the prerequisites remain distinguishable.
- Reward targets appeared for inheritance, leap, transcend, and time travel with current reward, next reward, cumulative target, and remaining currency. With Memory level 1, transcend displayed current +48 and next +50, reflecting the ×2 next-level reward increment.
- Starting from a valid time checkpoint, the browser purchased Cosmic Convergence (skill 6), Permanent Technology (8), Cosmic Legacy (9), and Permanent Civilization Record (10), then executed a time jump. On desktop and both mobile heights in both exports, the resulting save was valid after reload: time-jump count 2, all 87 technologies retained, era 4, time skills 8–10 retained, and unspent inheritance/innovation/transcend points 7/8/11 retained. Lower legacy skills reset to level 0; the base innovation/transcend skill was regranted.
- Bulk upgrades showed exact level counts and total costs. With 12 points, Max offered 6 levels for 12 points; with 22 points, Max 10 offered 10 levels for 22 points; with 1,148 points, Max offered all 124 levels for 1,148 points. Each purchase spent no more than the displayed amount and left a valid save. Without Time Navigation, Time Recursion remained disabled as “前提未達” even with Max selected. The same checks passed at all three viewport sizes in both exports.
- A value stored as `{log10: 1000}` displayed as `10^104 摩婆羅` in Buddhist notation. A high-production case displayed `毎秒 +10^243,506.86 毘伽婆`; facility purchase, cosmic-era technology research, manual gather, and time-skill purchase all completed with a valid save. No `NaN`, `[object Object]`, or `Infinity` appeared in the UI, and no browser errors occurred.
- At the exact final-goal log threshold, both exports opened the “1不可説不可説転” dialog, saved the reached state, and suppressed the dialog after Continue and reload. The ordinary first-clear checkpoint still opened only the first-clear dialog.
- The final-goal progress bar now advances before the endpoint: 1e68 reports 0.0%, money with log10=1e8 reports 17.3%, and the exact final goal reports 100.0% and “達成済み” in both exports. No invalid numeric text or browser errors appeared.
- Loading a v8 save expanded its three time-skill levels to the v9 11-entry array and preserved the original three levels. Restoring an uncleared v8 backup after opening the chronology panel converted it to a valid v9 save and switched away from chronology; the hidden chronology panel stayed inactive after reload in both exports.

## Screenshots

Representative screenshots include the endgame goal dialog, the prerequisite reroutes and selected detail at all viewport heights, and the 124-level bulk quote:

- Goal dialogs: `/tmp/v9-goal-index.png`, `/tmp/v9-goal-play.png`
- Mid-tree routes: `/tmp/v9-index-time-tree-middle-pc.png`, `/tmp/v9-index-time-tree-middle-mobile844.png`, `/tmp/v9-index-time-tree-middle-mobile667.png` (matching `play` screenshots are also present under `/tmp`)
- Lower tree and selected detail: `/tmp/v9-index-time-tree-lower-mobile667.png`, `/tmp/v9-index-time-detail-mobile667.png`
- Bulk quote example: `/tmp/v9-bulk-index-mobile667.png`
- Huge-value formatting: `/tmp/v9-log10-1000-mobile667.png`
