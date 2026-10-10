# GitHub Pagesで遊ぶ

公開先（デプロイが成功した後）:
https://nonsuger634-web.github.io/incremantal/

## 初回設定

GitHubにログインしてリポジトリの Settings → Pages → Build and deployment → Source を **GitHub Actions** に設定する。

設定後、Actions → Publish civilization game → Run workflow → main を選んで実行する。以後はmainへのpushで自動更新する。

- Pages設定: https://github.com/nonsuger634-web/incremantal/settings/pages
- 公開ワークフロー: https://github.com/nonsuger634-web/incremantal/actions/workflows/pages.yml

configure-pagesのGITHUB_TOKENは初回のPages有効化権限を持たないため、初回設定はリポジトリ管理者が行う。既にGitHub ActionsがSourceに設定されていれば初回設定は不要。Pages画面がプラン制限を表示する場合はその条件を確認する。公開設定のためにリポジトリの可視性は自動変更しない。

## 自動更新

GitHub ActionsはNode.js24でゲームルールのテストを実行し、単一ファイル版を再生成する。配布するのはindex.html/style.css/game.js/play.htmlだけ。ゲームはAPIやログインを必要としない。

SafariまたはChromeから公開URLを開く。進行はそのブラウザのlocalStorageに保存されるため、ChatGPT内の表示・別ブラウザ・ローカルHTMLの進行は自動では移らない。

## 今回確認できた範囲

ゲーム一式と公開ワークフローをmainにpushし、リモートのコミットを確認した。自動テスト18件成功。このクラウド環境はapi.github.comと公開ホストへの通信が403で拒否されるため、Pages設定の変更・Actionsの実行結果・公開URLの応答を確認できていない。push成功は公開完了の証拠ではない。
