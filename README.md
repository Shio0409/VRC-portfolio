# Sio's Portfolio

VRChatのワールド移動体験をモチーフにした、Sioのポートフォリオサイトです。現在はSound選択、Loading、仮TOPを実装しています。

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
node --check src/app.js
node --check src/entry-flow.js
node --check src/assets.js
node tools/build.mjs
```

公開用の静的ファイルは`web/dist`へ出力されます。GitHub Pagesへの配置を想定しています。接続だけではサイトのデプロイは実行されません。

## 構成

- `web/`: HTML / CSS / JavaScript、カーソル素材、開発ツール、テスト。
- `material/playing.png`: Loading画面で使用する画像原本。
- 詳しい実装内容は[web/README.md](web/README.md)を参照してください。

Git管理の対象はWebサイトとビルドに必要な素材です。Unityプロジェクト、制作途中の仕様書・コンセプト資料、生成物は対象外です。
