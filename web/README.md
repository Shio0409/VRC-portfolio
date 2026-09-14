# Sio's Portfolio — Web

現在の実装は **Sound選択 → 00 Loading → 01 TOP / 3D Avatar / Skill Menu** です。サイト全体の基準はプロジェクトルートの「portfolio sitedesign.md」を参照してください。

## 技術構成

- HTML / CSS / JavaScript（ES Modules）。TOPはThree.js 0.180.0を使用。必要なモジュールを`assets/vendor/three`に同梱し、MITライセンスを保持しています。外部CDNには接続しません。
- Node.js 22以上で開発サーバー・静的ファイル出力・テストを実行。
- GitHub Pages用に静的ファイルだけを出力。リポジトリは[Shio0409/VRC-portfolio](https://github.com/Shio0409/VRC-portfolio)。Pages公開設定とサブドメイン名は未設定。
- ファイルURLは相対指定。ドメイン直下とGitHub Project Pagesのサブパスに対応する構成。
- フォントは端末のシステムフォントを使用。フォント最終選定は保留。
- WebランタイムはUnityプロジェクトにアクセスせず、Web用に書き出したGLBのみ使用します。

## 実行

この`web`ディレクトリで実行します。パッケージのインストールは不要です。

```sh
node tools/serve.mjs
node tests/entry-flow.test.js
node tests/viewport.test.js
node --check src/app.js
node --check src/entry-flow.js
node --check src/assets.js
node --check src/viewport.js
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
| top | TOPレイアウト・6カテゴリのSkill Menu。ENTRYへ戻って再確認可能 |

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
- 初回選択後の共通Soundボタンは44pxの円とスピーカーアイコンで表示。Hoverまたはキーボードフォーカス時に左へ伸び、現在の`SOUND ON / OFF`を表示する。周囲のレイアウトは動かさない。
- タッチ操作は円形ボタンのタップで切り替える。動きを減らす設定では伸縮アニメーションを省略する。
- `portfolio:sound-change`イベントで`detail.enabled`を通知し、後から音源を接続可能。
- LocalStorageへの保存は実装していない。保存・復元方針は未確定のまま。
- Global Soundと動画プレイヤーの優先関係は、動画実装時に確認。
- TOPでアバターを別途読み込みます。読み込み中は状態文、失敗時は再試行を表示します。Loading全体の待機対象への追加や低性能端末向けの最終Fallbackは保留です。
- 共通Navigation、アバター、CAREER、WORKS、CONTACTは今回の範囲外。
- GitHub Pages公開・DNS変更は未実施。

## アクセシビリティと軽量化

全画面で`src/viewport.css`の横画面レイアウトを共有します。四隅の共通UIと中央コンテンツの配置・情報はPCとスマートフォンで共通です。以前のスマホ向け縦積み、ヘッダーやフッターを隠すルールは撤去しました。

`src/viewport.js`は幅767px以下・主ポインターcoarse・縦向きの場合に回転案内を表示し、サイト本体をinertにします。回転でLoadingやSoundの状態を作り直さず、横向きに戻ると現在の画面へフォーカスを戻します。PCの縦長ウィンドウには回転案内を出しません。

画像や余白を画面の高さに合わせて調整し、操作ボタンは44px以上を維持します。全体の一括縮小やズーム禁止は行いません。最小レイアウト幅は568pxで、収まらない表示条件ではスクロールを許可します。`viewport-fit=cover`とsafe-area-insetでノッチ等を避けます。今後の各画面もこの共通方針を使用します。

- キーボード操作可能なbuttonと、操作対象が分かるfocus-visible。
- 非表示画面にはhidden属性を使い、画面遷移時に見出しへフォーカスを移動。
- progressbarの値、読込失敗の通知、画像の代替テキストを提供。
- prefers-reduced-motionではアニメーションを停止。
- 横画面の配置を維持し、内容が収まらない場合はスクロールを許可。
- 背景色は固定のCSSグラデーション。ぼけた光を個別の粒子として下から上へ動かす。画像・動画、Canvas、Three.js、外部フォントの読込なし。
- 粒子はPCで16個、主ポインターcoarseのタッチ端末で10個。大きさ・速度・開始位置・横方向の移動量を個別に設定し、56〜94秒でゆっくり上昇する。縦向き案内の表示中は停止する。
- 粒子の柔らかい輪郭もCSSグラデーションで描画。アニメーションは小さな要素のtransform / opacityのみを更新し、画面全体の移動やblurフィルターを使わない。動きを減らす設定では粒子を表示しない。

## 検証

`npm test`は、最低2秒、遅い読込、デコード待ち、SKIP、中断後の応答、失敗・再試行、Sound変更、初期Mute、進捗の速度変化と後退防止、読込文言の切り替えを確認します。`npm run check`でモジュール構文、`npm run build`で公開ファイルとHTMLのローカル参照を確認します。

ブラウザ上の最終的な見た目・端末実機での挙動は、プレビューでの確認事項です。

`tests/viewport.test.js`は初期表示、縦向きでの操作制御、回転後の現在画面への復帰、イベント解除を検証します。

## 01 TOP / Skill Menu（2026-09-14）

Loading・SKIPの移動先にTOPのレイアウトとSkill Menuを実装しました。`src/top.css`が左Navigation・中央の3D配置領域・右Skill Menuの構成を持ち、`src/skills.js`が仕様書9〜14項に基づく6カテゴリの内容を保持します。`src/top.js`がタブ・開閉・フォーカスを制御します。更新する文章はデータファイルに集約しています。

初期USER・メニュー開。カテゴリは下部6タブのみで切り替えます。左右キー・Home/End対応、Escapeと×で閉じ、SKILL MENUボタンで再表示します。再表示は選択カテゴリを維持し、ENTRYへ戻った場合はUSERへリセットします。将来のアバタークリックは`setupTop()`の`openSkills()`へ接続できます。

レイアウト段階ではスキル内容・操作までを実装し、その後GLB描画を接続しました（下記参照）。実アバター画像のプロフィールアイコン、Portal移動は未接続です。プロフィールは汎用の人物アイコンを使用しています。CAREER/WORKS/CONTACTのNavigationは「準備中」の無効ボタンとして表示しています。Navigationの見た目はコンセプトに基づく暫定案です。

PCとスマートフォン横画面で同じ3列構成を使用します。高さの小さい画面では左の紹介・NavigationとSkill本文をそれぞれスクロールでき、6タブは固定表示します。縦向きの制御は共通`viewport.js`と`viewport.css`を継続使用します。

検証：LoadingからのTOP表示、DEV切り替え、EndキーでMANAGEへ移動、閉じる・再表示時の選択維持、844×390での配置をブラウザで確認。既存のLoading/Orientation 14テスト成功。公開ビルドは14ファイルで、Three.jsとGLBはまだ含みません。

## TOPの3D接続（2026-09-14）

`src/avatar-slot.js`がTOPの入退場・中断・再試行を管理し、`src/avatar-scene.js`を動的importします。Three.jsとGLBはTOPに入るまで読み込みません。初回のLoadingは引き続き写真と最低2秒を待ち、TOPのアバター準備は別の状態文で表示します。Skill Menuは読込失敗時も操作可能です。

使用モデルは`assets/models/kipfel-preview.glb`（14,751,980 bytes、テクスチャ最大1024）。固定表情を含むUnity書き出し`kipfel-preview-20260913-052710.glb`を既存ツールで最適化しました。モデルはTポーズ・ギターあり・アニメーションなしの暫定表示で、最終ポーズの決定ではありません。Unity原本と全アニメーションのカタログGLBは公開ファイルに含めません。

全Bodyプリミティブの`eye_pupil_OFF`を1に固定。GPUへのアップロード前に未使用Morph Targetを除外し、既存ウェイトと固定表情を保持します。黒ずみ対策として頂点カラーの乗算を無効化し、確認ビューアーと同じ照明を使用。ポーズ・Blink等を採用する段階で必要なMorph TargetとAnimationの保持対象を拡張します。

アバターはボタンとしてキーボードでも選択でき、クリック/Enter/SpaceでSkill Menuを開きます。描画は初期表示・リサイズ・タブ復帰時のみで常時ループしません。DPRはPC最大1.5、coarseポインター最大1。ENTRYへ戻ると通信を中止し、geometry/material/texture/skeleton/rendererを解放します。

公開対象の追加ファイルは`tools/avatar-public-files.mjs`で配信とビルドに共通化しています。22ファイルを出力し、相対import mapとモデルURLでProject Pagesのサブパスにも対応します。今回のモデルとThree.jsの必要ファイルはWebで使用する素材としてGit管理します。

検証：PC/844×390で3D表示、アバターからメニューを再表示、ブラウザエラーなし。中断後の古い読込結果を破棄すること、リソース解放、失敗からの再試行を含む17テスト成功。実機モバイルでの性能確認は未実施です。

### アバター確認用ツール

`tools/avatar/README.md`にGLBの準備とThree.js確認ビューアーの起動方法をまとめています。`node tools/serve.mjs --avatar --port 4174`で確認画面を有効にできます。確認画面・カタログ用モデルは通常のサイト・公開ビルドには含まれません。


## TOP背景・会話・Glass UI（2026-09-14）

TOP専用の生成背景 `assets/top-world.webp`（1672×941、160,236 bytes）を追加。生成方法と最終プロンプトは `assets/top-world.md`。TOPに入った時点で初めて読み込みます。Loadingは従来の画像を使わないパーティクル背景を維持します。Skill Menuと会話枠を透過グラデーション、ぼかし、縁の光で構成しています。

`src/dialogue.js`にユーザーが承認した仮文4つを集約。45ms間隔の文字送り、クリックで全文表示、次クリックで次のセリフ、最後は最初から再生。Enter/Spaceでも操作できます。読み上げ用には文字送りではなく全文を提供。発話中の名前プレートに光のアニメーションを付け、音声はありません。別タブ・スマホ縦向きで文字送りを停止し、TOP退出でもタイマーを停止します。動きを減らす設定では即時全文表示します。

公開ビルドは24ファイル。会話の全文表示／次へ／再生、退出と再入場、非表示・縦向き停止、reduced-motionの3テストを加え、計20テスト成功。スマホのレイアウトは共通横画面方針を継続。アバターのポーズ・アニメーションは未確定のままです。
