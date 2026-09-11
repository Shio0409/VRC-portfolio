# Sio's Portfolio

VRChatのワールド移動体験をモチーフにした、Sioのポートフォリオサイトです。現在はSound選択、Loading、仮TOPを実装しています。

GitHub: [Shio0409/VRC-portfolio](https://github.com/Shio0409/VRC-portfolio)

## 開発

Node.js 22以上を使用します。外部パッケージのインストールは不要です。

```sh
cd web
node tools/serve.mjs
```

ローカルプレビュー: http://127.0.0.1:4173/

## 検証・ビルド

`web`ディレクトリで実行します。

```sh
node tests/entry-flow.test.js
node tests/viewport.test.js
node --check src/app.js
node --check src/entry-flow.js
node --check src/assets.js
node --check src/viewport.js
node tools/build.mjs
```

公開用の静的ファイルは`web/dist`へ出力されます。GitHub Pagesへの配置を想定しています。接続だけではサイトのデプロイは実行されません。

## 構成

- `web/`: HTML / CSS / JavaScript、カーソル素材、開発ツール、テスト。
- `material/playing.png`: Loading画面で使用する画像原本。
- `portfolio sitedesign.md`: サイト全体の仕様・確定事項・保留事項。
- `consept/`: 各画面と共通カーソルのコンセプト資料。
- 詳しい実装内容は[web/README.md](web/README.md)を参照してください。

Git管理の対象はWebサイト、ビルドに必要な素材、仕様書、コンセプト資料です。Unityプロジェクトと生成物は対象外です。
