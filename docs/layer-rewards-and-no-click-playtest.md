# 各層の累計生産と連打なし検証

> この報酬係数・24秒の結果は旧版です。現在の係数と約2分への調整結果は [right-actions-and-first-time-balance.md](right-actions-and-first-time-balance.md) を参照してください。

継承・飛躍・超越は、それぞれ上位リセット以降の累計生産を積算し、算出した総報酬から受取済み額を引いた差分だけを配ります。同層のリセットやポイント使用では台帳を消しません。飛躍は継承、超越は継承・飛躍、時間跳躍は下位3層の累計・台帳・資産を消します。「文明の永久記録」取得後はすべて保持します。全文明の累計生産と時間の台帳は常に保持します。無料基盤も既存資産として差し引き、リセットで無料分を払い戻しません。

初回超越の実行条件10^30は変更せず、報酬だけを `floor((R(E)-28)/1.5)`、継承の総報酬を `floor((R(E)-10)^2.7)` に調整しました。革新・時間の曲線は従来どおり。生産指数・最終生産倍率も維持し、全強化・全研究・各施設1000個の基準秒給は **0.0033不可説不可説転点/秒** です。継承の実購入レベルは無料補正とは別に上限まで購入できます。

旧セーブは購入済みスキル・残高を保持し、記録のない各層累計は周回累計（旧永久記録取得済みなら全文明累計）、受取済み額は少なくとも現有資産の購入価格合計から復元します。生涯回数は保存されている各回数から初期化します。以前の上位リセットで消えていた過去の回数・下層累計は復元できません。移行後は生涯回数を消しません。

ポイント残高・報酬・費用はカンマ付きアラビア数字で表示します。施設タブボタン・超越の旧概要・時間スキルの数量選択を削除しました。最終単位は、目標達成前でも秒給や生産量に出現した時点でマスクを解除し、その発見を保存します。390px/1280pxでリセット画面、320px〜1280pxで横はみ出し・手動ボタンの位置・ページ全体スクロールを確認しました。

以下は6-Lunaによる計算エンジンの直接プレイ結果です。画像認識を使わず、画面購入と同じ関数で操作しています。自動購入をゲームに追加する変更ではありません。

# Fresh no-click progression comparison

Reproduce the current utility-early run with:

```sh
node scripts/playtest/cumulative-no-click.mjs --clicks=0 --dt=0.1 --facility=desc --policy=utilityEarly --hours=24
```

It starts from `fresh()`, runs at normal 1x speed, makes no manual clicks or test grants, and validates after every reset and at the end. Facilities use descending bulk purchases. The inheritance rule is shared across the tested strategies: inherit only when the projected post-reset balance can afford an unlocked, unmaxed skill, except the first three inherits needed to meet the leap unlock.

## Current coefficients

The run uses inheritance power 2.7, transcend offset 28 / scale 1.5 / power 1, and time power 1.7.

| Milestone | Elapsed | Reset counts [inherit, leap, transcend, time] |
|---|---:|---|
| First clear (1 無量大数) | 1,531.0s / 25m 31s | [138, 24, 3, 0] |
| First time jump | 1,532.0s / 25m 32s | [138, 24, 3, 1] |
| First-cycle transcend reset awards sum to 18 | 1,556.0s / 25m 56s | [172, 42, 5, 1] |
| All lower skills, innovations, and transcend skills maxed | 1,609.0s / 26m 49s | [176, 49, 7, 7] |
| All time skills maxed | 1,610.0s / 26m 50s | [176, 49, 7, 8] |
| Final goal (1 不可説不可説転) | 1,913.03s / 31m 53s | final save valid |

The first time cycle spans jump 1 through immediately before jump 2. During it, two transcend resets grant **1 + 17 = 18 points**, at 1,536s and 1,556s. This sums only the reset awards and excludes the free starting foundation. The full snapshots, ledgers, reset counts, and event timestamps are in `layer-reward-results/utility-2.7.json`. Lower-layer max precedes time-skill max by one second.

The same engine and facility order with `balanced` and `recursive` time-skill priorities also reached both goals and validated. Balanced: clear 1,531s, goal 1,938.03s, lower max at 1,635s and time max at 1,634s. Recursive: clear 1,531s, goal 1,852.03s, lower max at 1,547s and time max at 1,549s. These additional results are in `layer-reward-results/balanced-2.7.json` and `layer-reward-results/recursive-2.7.json`; recursive was fastest among these three policies.

## Previous engine snapshot

Using the same utility-early strategy and 0.1s cadence against `before-engine.js`, the run reached clear at 1,207s (20m 07s) and the final goal at 1,599.03s (26m 39s), with valid saves. Its first time cycle grants **2 + 4 = 6** transcend points, and lower skills were not all maxed when the time tree maxed. The current curve brings the first-cycle award to 18 and achieves the lower-max-before-time-max milestone. Elapsed time increased by about 27% to clear and 20% to final goal, so the previous and current curves remain in a similar completion-time range while meeting the new point and max-order conditions.

The old engine has no lower-reset credit ledger and can repeatedly offer the same gross reward. To keep it progressing, the scratch runner suppresses an inheritance when its gross reward has not exceeded the prior inheritance reward in that lower-layer run; it clears that marker after an upper reset that clears lower assets. The old engine then grants each higher gross reward in full. This guard makes the old run finite, but the old/current elapsed times are not a controlled speed comparison. Raw output is in `layer-reward-results/baseline-utility.json`.

These are bounded strategies, not a proof of globally optimal play.
