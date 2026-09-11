# Sio's Portfolio — Web

初回実装は **Sound選択 → 00 Loading → 仮TOP** です。サイト全体の基準はプロジェクトルートの「portfolio sitedesign.md」を参照してください。

## 技術構成

- HTML / CSS / JavaScript（ES Modules）。ランタイム・開発用とも外部依存パッケージなし。
- Node.js 22以上で開発サーバー・静的ファイル出力・テストを実行。
- GitHub Pages用に静的ファイルだけを出力。サブドメイン名やGitHubリポジトリは未設定。
- ファイルURLは相対指定。ドメイン直下とGitHub Project Pagesのサブパスに対応する構成。
- フォントは端末のシステムフォントを使用。フォント最終選定は保留。
- Unity側のファイルは使用・変更しない。Three.jsはアバター実装の段階で導入を検討する。

## 実行

この`web`ディレクトリで実行します。パッケージのインストールは不要です。

```sh
node tools/serve.mjs
node tests/entry-flow.test.js
node --check src/app.js
node --check src/entry-flow.js
node --check src/assets.js
node tools/build.mjs
node tools/serve.mjs --dist
```

通常のNode.js / npm環境では、同じ操作を`npm run dev`、`npm test`、`npm run check`、`npm run build`、`npm run preview`でも実行できます。Node.jsのみ利用できる環境では、上記の直接実行を使用してください。

開発サーバーの既定URLは `http://127.0.0.1:4173/` です。別ポートは `node tools/serve.mjs --port 4174` と指定します。開発用と公開用プレビューを同時に同じポートでは起動しないでください。

`npm run build`は`web/dist`に公開用ファイルを出力します。原本`material/playing.png`を読み取り、公開用出力にコピーします。原本の編集・変換は行いません。開発サーバーは同じ原本を画像URLへ割り当てて配信します。Unity・仕様書・その他の素材ディレクトリは配信しません。

## 状態と責務

| 状態 | 動作・遷移 |
|---|---|
| entry | Muteから開始。Sound ON / OFFの明示操作でloadingへ |
| loading | 画像の転送・デコード完了と最低2秒を待ち、両方成立後topへ |
| error | 再試行またはSKIPを提示。再試行時は読込と2秒の計測を再開 |
| top | 許可された仮表示。ENTRYへ戻って再確認可能 |

- SKIPは最低表示時間や読込完了を待たずtopへ移動し、進行中の通信・フレーム更新を中止。
- 古い通信の成功・失敗が、SKIP後や再試行後の画面を上書きしない。
- Blob URLは終了・中断時に解放。
- 初期読込対象はLoading画像のみ。後から`src/assets.js`に必要なアバター読込を統合できる。
- `src/entry-flow.js`はDOMを扱わず、読込・時計・フレーム予約を注入可能。最低表示時間と中断を単体で検証する。
- `src/app.js`は表示、フォーカス移動、ボタン、Sound状態の通知を担当。
- `src/styles.css`は参照画像に基づく濃い青緑・独立して上昇する光の粒子・中央サムネイル・シアンの輪郭・共通カーソルを担当。

## Progress Bar

転送量が取得できる場合は実読込率を使用し、画像デコードが終わるまで完了扱いにしません。バーは「接続画面全体の準備状況」を示し、最低表示時間に沿って加速・減速する演出の進捗と、読込側の進捗の小さい方を表示します。後退させず、転送中は98%未満に抑え、100%は時間と読込完了の両方が成立した場合のみです。

画像が早く読み込めた場合、残り時間はバーの進行演出になります。Content-Lengthが不明の場合も待機表示を継続し、デコード完了後に進めます。ネットワークの架空の容量や割合は表示しません。

開始時は`Traveling to Website...`。最低表示時間の58%以降に転送完了相当（進捗99%以上）またはデコード完了を確認すると`Initializing Website...`へ切り替えます。遅い読込で最低2秒を超えた場合は、完了後に追加の演出待ち時間を設けずTOPへ進みます。

## 共通カーソル

`consept/cursor_normal.png`と`consept/cursor_hover.png`を基に、透過SVGを`assets`へ作成しています。原本は変更しません。

- マウス操作では通常時に円形のnormal、ボタン・リンク等の操作対象上でシアンのhoverを使用。子要素の文字・アイコン上にも適用。
- クリック位置はnormalが中心、hoverが矢印の先端。CSSのネイティブカーソルを使用し、JavaScriptで追尾する要素は追加しない。
- 将来のThree.js内のクリック可能な作品では、レイキャスト結果に応じてCanvasへ`data-cursor="hover"`を付けて切り替える。
- タッチ専用端末にカーソルを追加しない。強制カラー表示時は標準カーソルを使用する。

## Sound・保留事項

- ON / OFFは現在の画面セッション内で管理。音源未提供のため音の再生処理は未実装。
- `portfolio:sound-change`イベントで`detail.enabled`を通知し、後から音源を接続可能。
- LocalStorageへの保存は実装していない。保存・復元方針は未確定のまま。
- Global Soundと動画プレイヤーの優先関係は、動画実装時に確認。
- TOPは仮表示であり、未ロードアバターの最終Fallbackは決めていない。
- 共通Navigation、アバター、CAREER、WORKS、CONTACTは今回の範囲外。
- GitHub Pages公開・DNS変更は未実施。

## アクセシビリティと軽量化

- キーボード操作可能なbuttonと、操作対象が分かるfocus-visible。
- 非表示画面にはhidden属性を使い、画面遷移時に見出しへフォーカスを移動。
- progressbarの値、読込失敗の通知、画像の代替テキストを提供。
- prefers-reduced-motionではアニメーションを停止。
- モバイル幅・低い横長画面に対応。内容が収まらない場合は縦スクロールを許可。
- 背景色は固定のCSSグラデーション。ぼけた光を個別の粒子として下から上へ動かす。画像・動画、Canvas、Three.js、外部フォントの読込なし。
- 粒子はPCで16個、幅700px以下で10個。大きさ・速度・開始位置・横方向の移動量を個別に設定し、56〜94秒でゆっくり上昇する。
- 粒子の柔らかい輪郭もCSSグラデーションで描画。アニメーションは小さな要素のtransform / opacityのみを更新し、画面全体の移動やblurフィルターを使わない。動きを減らす設定では粒子を表示しない。

## 検証

`npm test`は、最低2秒、遅い読込、デコード待ち、SKIP、中断後の応答、失敗・再試行、Sound変更、初期Mute、進捗の速度変化と後退防止、読込文言の切り替えを確認します。`npm run check`でモジュール構文、`npm run build`で公開ファイルとHTMLのローカル参照を確認します。

ブラウザ上の最終的な見た目・端末実機での挙動は、プレビューでの確認事項です。
