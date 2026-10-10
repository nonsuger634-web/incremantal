# リセットUIと時間跳躍の累計報酬

4種類のリセット欄は、見出し・説明・条件・次の報酬・獲得ポイント付きボタンの5項目で統一。未使用ポイントはスキル見出し、回数とリセット内容は欄外の補足へ移動した。390px/1280pxの実際の画面を変更前後で確認し、同じ構造・文字サイズ・余白で表示する。

時間跳躍の報酬は `resetReward(lifetime, 'time')`。通算累計からの圧縮対数を使い、offset=60・scale=8・power=1.3を維持。次の報酬に必要な文明力と残りも通算累計で計算する。他の3リセットは周回累計のまま。

実行条件は、クリア済みかつ周回累計が従来の `timeThreshold` 以上。必要指数68+12×跳躍回数は従来どおり。跳躍直後に過去の通算累計だけで連続実行できないようにする。過去の生産が大きいセーブでは条件達成時の報酬が増える。

初回時間跳躍後から、まとめ買い・毎日8時間放置で変更前後を比較した。バランス優先と永久効果優先の2方針に対し、1分・15分・1時間・3時間間隔の8条件すべてで最終目標への到達時間と時間跳躍時刻が一致した。3時間間隔のバランス優先では一部の報酬とスキル購入が変わったが、到達時間は一致。全てのセーブと任意の操作方法で同一時間になることを保証する検証ではない。

結果は [time-lifetime-comparison.json](time-lifetime-comparison.json)。比較の起点は0c8f4b2。

```sh
node scripts/playtest/endgame.mjs --intervals 1m,15m --branches balanced,utility-early --days 4 --sleep daily --purchases bulk
node scripts/playtest/endgame.mjs --intervals 1h,3h --branches balanced,utility-early --days 14 --sleep daily --purchases bulk
```

時間跳躍報酬の通算累計依存、周回条件が未達なら0、次報酬の逆算、リセット後の通算保持と再実行防止を自動テストで確認。ブラウザでは4リセットの構造、表示幅320〜1280px、既存の説明中の一時停止と研究の連続購入も確認した。
