# Sio's Portfolio — サイト仕様書

更新日：2026-09-11

本書は、旧「portfolio sitedesign.txt」の全26項目と、その後のユーザー回答を統合した実装基準です。後から確定した内容を優先し、未確定の内容は保留事項として明記します。元資料の移行・更新であり、Webサイトが実装済みであることを示すものではありません。

## 仕様・資料の優先順位

1. ユーザーが明示した最新の確定事項。
2. 本書に整理した確定仕様と、ユーザーが指定した実素材。
3. コンセプトアートのレイアウト・質感・雰囲気。

コンセプトアート内の生成由来と思われる文字、架空の経歴・数値・プロフィール、仕様にないUIは採用しません。実素材の対応をファイル名の類似だけで判断しません。不明な内容は推測で補完せず、必要な段階で確認します。

## 1. コンセプト

ポートフォリオそのものを「VRChatのワールドを巡る体験」として設計します。

単なるVRChat風の見た目ではなく、馴染みのあるUI・ワールド移動・インタラクションをWebサイトとして再構成します。

**デザインの核：VRCの情報設計 × 半透明ガラスUI × 幻想的な仮想空間**

VRChat公式UIや素材を直接使用せず、構造・操作感・雰囲気を参考にしたオリジナルデザインとします。

サイト構成：

- 00 ENTRY / LOADING
- 01 TOP
- 02 CAREER
- 03 WORKS
- 04 CONTACT

基本操作は縦スクロール。各セクションはNavigationから直接移動することもできます。

## 2. 共通デザイン

### 色・Glassmorphism

- ベースカラー：黒・濃紺・青緑。
- アクセント：シアン〜ターコイズ。
- 文字色：青みのある白を中心とする。
- 主要UIは半透明のGlassmorphism。
- 濃紺系半透明パネル、Background Blur、細いシアンのBorder、弱いGlow、控えめなGradient、大きすぎない角丸。

VRChatの実用的な情報設計をベースに、VRChat本体より透明感・光・奥行きを強くします。

### 背景

幻想的な仮想空間を表現します。星空、水面、発光植物、光のリング、Portal、浮遊構造物、暖色の小さな照明などを使用します。

背景はUIより目立たせません。具体的な背景実素材は未確定です。

### Typography

- 本文：読みやすいサンセリフ体。
- 見出し・英字：少し近未来的な書体。
- 手書き風文字：サインや短い装飾文に限定。
- 具体的なフォントは未確定。

## 3. 共通Navigation

主要Navigationは01 TOP、02 CAREER、03 WORKS、04 CONTACTです。

- 現在表示しているセクションをシアンのGlowやラインで強調。
- Portal演出とは独立して、いつでも直接セクション移動できる。
- 共通Navigationの最終ビジュアルは未確定。

## 4. ENTRY / SOUND

初回アクセス時にSound ON / OFFを確認します。

表示の基本：

- SoundをONにしますか？
- ON
- OFF

初期状態はMute。ONを選択した場合のみ、次の音を有効にします。

- UI Hover
- UI Click
- Portal
- Switch
- Video / Video Player
- Environment

サイト内からいつでもSound ON / OFFを変更できます。アバターには音声を付けません。動画プレイヤー自体にはVolume / Mute操作を持たせます。

**音素材は別途用意します。** CAREERのVolume / Muteで制御する音素材の具体的な内容も未確定です。

次の事項は未確定です。

- Global Sound OFF時に動画側操作で音をONにできるか。
- Sound設定をLocalStorage等へ保存するか、および保存方法。
- 再訪時に前回設定を復元するか。

## 5. LOADING

Sound設定後に、VRChatのワールド移動画面をモチーフにした軽量で簡素なLoading画面を表示します。

### 素材・構成

- 3Dアバターは表示しない。
- 中央サムネイルは **`material/playing.png`** を使用する。
- 内容は、暗いVRChatワールド内でアバターがアコースティックギターを弾いている横長の静止画。
- 原本ファイルの存在と画像内容は確認済み。コンセプトアートから切り抜いて代用しない。
- 背景は濃い青緑の固定CSSグラデーションとし、画像を使用しない。もや・ぼけた光は個別の粒子として下から上へゆっくり動かし、大きさ・速度・開始位置に差を付ける。
- 粒子は小さな要素のtransform / opacityでアニメーションする。背景全体や大きなレイヤーは移動させず、粒子数を抑えて軽量化する。小画面では粒子数を減らし、動きを減らす設定に対応する。

表示文言：

```text
Traveling to

Sio's Portfolio
by Sio0409

Traveling to Website...
```

読込後半の準備段階で、進捗バーの文言を **`Initializing Website...`** に切り替えます。タイトル上の`Traveling to`は固定です。

Progress BarとSKIPボタンを設置します。

### 表示時間・読込

- **最低2秒表示する。**
- 2秒経過時点で必要な読み込みが終わっていなければ、完了まで表示を継続する。
- 読み込みが先に終わった場合は、残り時間を演出として表示する。
- 通常終了は「2秒経過」と「必要な読み込み完了」の両方を満たした時点。
- Progress Barは実読込を踏まえ、一定速度ではなく加速・減速を交えて進める。進捗は後退させず、完了後に残る最低表示時間は演出として扱う。
- 初回実装の読込対象はLoading画像のみ。TOPアバターなど、将来の初期読込対象は追加時に整理する。

SKIPを押すと即TOPへ移動します。SKIPは通常終了とは別の経路です。初回実装の移動先は仮TOP表示とし、未完了の画像読込は中止します。将来TOPアバターが未ロードのときの最終的な表示方法は未確定です。

## 6. 01 TOP / 3D Avatar

テーマは **「VRChatで自分と会う」** です。

プロフィールページを見るのではなく、自分のアバターが存在するワールドへJoinしたような体験にします。

### 採用するアバター

- 外見の基準は、コンセプトアート作成時にユーザーが提示した三面図。
- Web用モデルの元は、Unity Hierarchyの **`Kipfel for portfolio`**。
- Unityプロジェクト：`siofel 2601`。
- 読み取り確認時、開いている「Kipfel」シーン内の`/Kipfel for portfolio`として存在を確認済み。
- 保存済みシーンファイル内では、確認時点で同名を確認できていない。Hierarchy上の指定と、保存済みファイルの確認状況は区別する。
- 三面図の実画像自体は調査時点で未確認。以下の外見指定と、ユーザーが指定した対象を基準とする。

外見の主要要素：

- 白〜薄いグレーの髪
- 猫耳
- 水色系の目
- クリーム色のニットベスト
- 淡いブルーグレーの長袖
- 黒系カーゴパンツ
- 黒系ブーツ
- 斜め掛けバッグ
- 大きな白系の尻尾（途中に濃色の帯）

**ポーズは後日決定します。** ギターを持つ状態や座り姿をTOPのデフォルトとして確定しません。Loading写真のポーズをTOPへそのまま適用しません。

### Web表示

- Three.jsで3D表示。
- 形式はGLB / glTF。Web表示専用に軽量化する。
- Bone、SkinnedMesh、BlendShape / Morph Target、Animationを使用。
- 通常時はIdle Animation。具体的なIdle Pose・動きは未確定。
- Blink、小さな身体の動き、頭の動き、会話時Gesture、クリック等へのReactionを追加。
- アバター音声は使用しない。
- トゥーン表現はWeb向けに再構築し、lilToonそのものは使用しない。

GLB / glTFは調査時点で未用意です。今回の仕様整理では変換しません。

## 7. TOP Conversation

- 初回表示時にアバターが挨拶する。
- 吹き出しをクリックして会話を進める。
- 「挨拶 → 簡単な自己紹介 → サイトについて → 見ていってください」程度の短い構成。
- 文字表示中を「発話中」とし、アバター名表示を発光・軽く明滅させる。
- VRChatでVoiceが入っているときの感覚を、音声なしで再現する。

確定会話全文は未用意です。

## 8. TOP Skill Menu

VRChatのQuick Menu / Launch PadをモチーフにしたスキルセットUIです。

- **初期状態から開いている。**
- Close（×）で閉じられる。
- アバタークリックで開く操作も維持する。
- メニュー全体を一枚のUIとして扱う。
- 数値によるスキル評価は行わない。
- 「何ができるか」「何を作ったか」「どう使っているか」を表示する。

上部：

- Avatar Icon
- sio0409
- Status：**お気軽にご連絡ください！**
- Close（×）

中央は、現在選択しているカテゴリの説明領域として広く使用します。

下部タブ：

- USER
- 3D
- DEV
- DESIGN
- MUSIC
- MANAGE

各カテゴリにアイコンを付けます。**カテゴリ変更は最下部の6タブのみ**で行います。コンセプトアートにあるProfile / Works / Skills / Moreの追加カードを、新たな必須機能として採用しません。

このStatus指定はTOP Skill Menuに限ります。CONTACTのStatusは未確定です。

## 9. Skill / USER

企画・制作・技術・運営を横断して、アイデアを実際に動く形まで持っていく人物像を示します。

- 0→1
- 企画から実装まで
- 要件・仕様整理
- 技術と利用者の橋渡し
- 制作から運営まで
- 新技術を実践へ取り入れる

## 10. Skill / 3D

中心となる技術：Unity / Blender / C# / UdonSharp / VRChat。

実務・制作内容：

- VRChat World制作
- World Gimmick
- Avatar Gimmick
- Network Sync
- Quest対応
- 3D Modeling
- VRChat向け小物制作
- 衣装制作
- World Asset制作

## 11. Skill / DEVELOPMENT

### 技術

HTML / CSS / JavaScript / TypeScript / Python / C# / UdonSharp / Lua / SQL / Google Apps Script / Linux / Git・GitHub。

### 制作経験

- Web制作
- API連携
- Discord Bot
- LINE Bot
- 業務自動化

### プログラミング教育経験

- Scratch
- Roblox Studio
- MakeCode Arcade

### AI活用

ChatGPT / Codex / Claude / Suno / Tripo / Blender MCP / Unity MCP。

単なるツール一覧ではなく、設計・コーディング・デバッグ・制作・業務効率化などへの活用として見せます。

## 12. Skill / DESIGN

- Web Design
- UI Design
- Graphic Design
- ポスター
- フライヤー
- 名刺
- ノベルティ
- 広報物
- 画像編集
- 動画編集
- VRChat向けビジュアル制作

使用ツールは補足情報として、Adobe系 / GIMP / Inkscape / DaVinci Resolveなどを表示します。

## 13. Skill / MUSIC

- 作詞
- 作曲
- 編曲
- Cubase
- Guitar
- Keyboard
- Vocal
- 弾き語り
- ライブ出演
- VRChat音楽ライブ
- 音を使った空間演出

## 14. Skill / MANAGEMENT

企画・ディレクション・PMを中心に見せます。

### Planning / Direction

- 新規企画立案
- 要件整理
- 仕様整理
- スケジュール管理
- 複数案件の並行進行
- 人員配置
- 役割分担
- 外部関係者との調整
- 予算を踏まえた企画調整
- 利用者の反応を見た改善
- 曖昧なアイデアの具体化
- 制作側と利用者側の調整

### Event / Community

- イベント企画
- 当日運営
- 出演者・スタッフ調整
- 参加者対応
- 外部施設との調整
- VRChatイベント運営
- 音楽ライブ運営
- 教育コミュニティ運営
- 初心者向けコンテンツ設計

### Business

- 新規事業・サービス立ち上げ
- 事業運営
- チーム運営
- 業務改善
- 広報
- 顧客対応
- 経理
- 補助金関連業務
- 各種申請
- 経営会議への参加

資格として日商簿記2級を表示します。Office / Google Workspace系は補助的な扱いにします。

## 15. 02 CAREER

テーマは **「自分のキャリアを動画として再生する」** です。

### 再生方式

一本の動画ファイルを再生する方式ではありません。HTML / CSS / JavaScriptで、動画プレイヤーを模したインタラクティブなCareer Timelineを実装します。

**実装上の扱い：HTMLベースのCareer Presentation。**

VizVidをモチーフにしたオリジナルプレイヤーUIを画面の大部分に表示し、メイン画面内の情報を時間経過に合わせて切り替えます。説明・写真・年・実績などは基本的にメイン画面内へ配置します。

表示情報：

- 年
- 所属
- 役割
- 説明・出来事
- 写真
- 実績
- 制作物
- 数値

操作：

- 自動再生 / Auto Play
- Play
- Pause
- Seek
- シークバークリックで任意地点へ移動
- Current Time
- Volume / Mute
- Fullscreen相当の表示

シークバーは人生・キャリアのタイムラインそのものです。上に年号と開始位置を表示し、各年がどこから始まるかを明確にします。年号は確定原稿に対応させます。資料中の例示年号を、存在しない経歴として追加しません。

同じ年の項目も独立した経歴として扱います。各項目の再生時間・同年内の詳細な時期や表示順の調整は未確定です。音素材は別途用意し、CAREER自体をYouTube動画に置き換えません。

### 掲載原稿

以下はユーザーが提示した原稿と、その後の年・項目の追加を反映したものです。原稿にない所属名・数値・担当業務・写真を補完しません。

#### 2017 — UNIVERSITY / PSYCHOLOGY

##### 心理学を学ぶ

大学で心理学を専攻。人の認知・行動・コミュニケーションについて学ぶ。

その後の教育、ユーザー理解、UXへの関心につながる土台となった。

**Keywords**：Psychology / Communication / Human Behavior

#### 2017 — CRAM SCHOOL TEACHER

##### 大手学習塾で講師を経験

大手学習塾で、小学生から高校生までを対象に指導。

個別指導・集団指導の両方を経験し、受験生の指導も担当。

相手の理解度に合わせて説明方法を変えることや、限られた時間の中で目標達成まで導く力を身につける。

**Keywords**：Teaching / Presentation / Communication / Coaching

#### 2019 — AFTER-SCHOOL CARE

##### 学童保育事業へアルバイトとして参加

民間学童保育事業にアルバイトとして入社。

子ども・保護者対応や日々の教室運営に携わり、教育サービスの現場経験を積む。

小規模だった事業の成長過程にも関わる。

**Keywords**：Education / Operation / User Support

#### 2022 — FULL-TIME EMPLOYEE

##### 社員第一号として正社員登用

事業拡大に伴い、社員第一号として正社員へ。

現場業務だけでなく、

- 教室運営
- イベント企画
- スタッフ調整
- 広報
- 経理
- 各種申請
- 業務改善

など、事業運営全体へ担当領域を広げる。

企画を考えるだけではなく、人・時間・予算・関係者を整理しながら、実際に運営できる状態まで持っていく経験を積む。

**Keywords**：Management / Planning / Direction / Business Operation

#### 2022 — PROGRAMMING SCHOOL

##### プログラミング教室 主任講師

学童事業内のプログラミング教室で主任講師を担当。

Scratch、Minecraft、ゲーム制作、PC操作、AI・情報リテラシーなどを扱い、教材の企画・制作から授業運営まで行う。

受講者が実際につまずいたポイントを観察し、教材や説明方法を継続的に改善。

**Keywords**：Programming / Education / UX / Content Design

#### 2023 — 教室長代理

##### 教室長代理に就任

就任年と項目の追加は確定しています。担当業務・説明本文・Keywords・英字見出しは未確定です。

#### 2023 — BUSINESS EXPANSION

##### 市の補助事業へ移行・2教室へ拡大

事業が市の補助制度の対象となり、補助金を活用した運営を開始。

同時期に教室数も2拠点へ拡大。

補助金に関する申請・報告業務をはじめ、拡大する事業の運営体制づくりに携わる。

小規模組織から複数拠点を持つ事業へ成長する過程を経験。

**Keywords**：Business Growth / Operations / Administration / Coordination

#### 2023 — COMPASS

##### 自分の事業「Compass」を開始

自身でも小規模な教育・クリエイティブ事業「Compass」を開始。

企画、サービス設計、教材制作、運営などを自ら行う。

会社の中で企画を実行する経験に加え、**自分でゼロからサービスを作り、運営する経験**を積み始める。

**Keywords**：Entrepreneurship / Planning / Service Design / Operation

#### NOW

##### 教育・事業運営から、体験づくりへ

心理学 → 教育 → 事業運営 → プログラミング → サービス立ち上げ、と経験を広げてきた。

現在はさらにUnity、VRChat、Blender、Web、音楽などの制作領域を組み合わせ、**「アイデアを、人が体験できる状態まで形にする」**ことを次のキャリアの軸としている。

### 旧仕様から引き継ぐ未整理の掲載項目

旧仕様には、CAREERに「個人オンラインゲーム開発」を含める指定がありました。また、大きな流れとして「大学・心理学 → 学童勤務 → 正社員・運営 → プログラミング教育 → 企画・サービス → Unity / VRChat → 個人オンラインゲーム開発 → 現在」が記載されていました。

最新原稿を本文の基準としつつ、この旧指定を黙って削除しません。「個人オンラインゲーム開発」の年・本文・最新原稿への組み込み方は未確定として保持し、必要な段階で確認します。Unity / VRChatは最新原稿のNOWに記載がありますが、独立した年次項目は確定していません。

## 16. 03 WORKS

テーマは **「自分の作品が展示されたVRChatワールド」** です。

展示空間は一つにまとめ、カテゴリごとの別部屋には分けません。

掲載する作品は次の5系統で確定しています。

1. 衣装「生意気pupil」
2. アロマキャンドル
3. ムチォOSC割り込みシステム
4. Syncパーティクルシステム
5. にゃんぐどらむ・鉄琴

**実素材の選定・対応付けは後回し**とします。具体的な展示レイアウトも未確定です。

現在Unity Assets内で見つかった素材を、名前が似ているという理由だけでこれらの作品として扱いません。作品ごとの正式な素材との対応は別途確認します。

## 17. WORKS Interaction

- WORKS内も第24項の共通カーソルを使用し、クリック可能な作品上ではhoverへ切り替える。
- 作品Hover時にOutline / Glow / Highlightを表示。
- 合わせて作品名・制作時期・使用ツール・簡単な説明を表示。
- 作品クリックで詳細モードを開く。
- 3D作品はThree.jsによる360° Viewerで表示し、ドラッグで回転できる。

詳細情報の基本項目：TITLE / YEAR / CATEGORY / TOOLS / ROLE / DESCRIPTION / LINK。

作品名・展示方針以外の具体的な作品情報やリンクは未確定です。

## 18. WORKS / LuraSwitch2

展示空間の一部は最初暗い状態とします。

LuraSwitch2をモチーフとしたスイッチを押すことで、**OFF → ON → Light点灯 → 展示物が見える**という演出を行います。

## 19. WORKS / Mirror

展示空間内にMirrorを配置します。

- 主要機能ではなく、VRChatらしさを補強する小さな演出。
- Mirror内にはTOPで使用している自分のアバターが映る。
- パフォーマンスを優先し、重いリアルタイム反射にはこだわらない。
- スマートフォンでは必要に応じて表現を簡略化する。

## 20. WORKS / Video

**動画はYouTubeを埋め込みます。**

動画が必要な作品には、VizVid風のオリジナルプレイヤーUIを使用します。YouTube埋め込みとUIを統合する具体的な方法は実装設計時に整理します。

必要な機能：

- Play
- Pause
- Seek
- Volume
- Mute
- Current Time
- Duration
- Fullscreen
- Video Title

各作品のYouTube動画・URLは未確定です。動画側Volume / MuteとGlobal Soundの関係は第4項の保留事項に従います。

## 21. WORKS 展示方法

| 作品 | 展示方法 |
|---|---|
| 生意気pupil | 3D衣装展示 ＋ 360° Viewer |
| アロマキャンドル | 3D Object展示 ＋ 360° Viewer |
| ムチォOSC割り込みシステム | 概要 ＋ 仕組み説明 ＋ Demo Video |
| Syncパーティクルシステム | Particle表現 ＋ 同期についての説明 ＋ Demo Video |
| にゃんぐどらむ・鉄琴 | 3D展示 ＋ 360° Viewer ＋ 演奏Demo Video |

Demo Video・演奏Demo Videoにも第20項のYouTube埋め込み方針を適用します。

## 22. 04 CONTACT

テーマは **「VRChat User Profile」** です。

一般的な問い合わせページではなく、sio0409のユーザープロフィールを開いているようなUIにします。

Glassmorphismを維持しながら、不要な装飾を極力省いた情報中心の画面にします。

表示内容：

- Avatar Icon / Avatar Image
- sio0409
- Status
- Bio / Profile
- Links
- Languages

リンク種別：GitHub / X / VRChat / YouTube / Email / 必要なその他リンク。

プロフィール下部にVRChatの「World」「Avatar」などのカテゴリタブは設置しません。

最終Bio、Status、Languages、各URL / Email、プロフィール画像は未確定です。コンセプトアートの文章・言語・Statusを確定情報として流用しません。TOP Skill MenuのStatusをCONTACTへ自動適用しません。

## 23. Portal Transition

セクション間はPortal移動をイメージした短いTransitionを使用します。

**Scroll → Portalへ接近 → Portal通過 → Transition → 次のSection**

- 通常のセクション移動演出は0.5〜1秒程度。
- 操作を長時間止めない。
- 直接Navigationによる移動は常に可能とする。
- スクロール、Viewerのドラッグ、動画やCAREERのSeek等の操作を競合させないよう、制御方法を設計時に整理する。

## 24. Cursor

- サイト全編でデフォルトカーソルを置き換え、`consept`に追加されたカーソル画像を外見の基準とする。
- 通常時は`consept/cursor_normal.png`を基にした、小さな白い中心と灰色のぼけを持つ円形カーソル。
- クリック可能なコンテンツ上では`consept/cursor_hover.png`を基にした、シアンのポインターへ切り替える。ボタン内部の文字やアイコン上でも同じ状態を維持する。
- Web用には背景を含まない透過SVGを作成し、CSSの`cursor`で適用する。通常時のクリック基準点は円の中心、hover時は矢印の先端とする。
- 全編共通という最新指定に従い、旧WORKS専用QVPenカーソル指定は採用しない。
- カスタムカーソルはマウス等のポインター操作に適用する。タッチ専用端末には表示せず、強制カラー表示時は標準カーソルを使用する。
- タッチ端末でのHover情報の提示方法など、具体的な操作設計は未確定。

## 25. 実装構成

UIの大部分はHTML / CSS / JavaScriptで制作します。

### HTML / CSS / JavaScript側

- Navigation
- Text
- Glass Panel
- Buttons
- Skill Menu
- HTMLベースのCareer Presentation / Career UI
- Video Player UI
- Contact
- Loading UI

### Three.js側

- TOP 3D Avatar
- WORKS 3D Viewer
- 必要な3D演出

UIや背景全体をThree.jsで構築しません。

初回のLoading実装は、`web`をWebルートとし、HTML / CSS / JavaScript（ES Modules）で作成します。外部依存パッケージは使用せず、Node.jsで開発サーバー・静的ファイル出力・状態遷移テストを実行します。公開用出力は`web/dist`です。

初回実装ではFramework・TypeScript・Routerライブラリは導入しません。サイト全体への拡張時の採用判断は保留します。Skill SetにTypeScript等を掲載することと、このサイトの実装技術として採用することは区別します。

## 26. パフォーマンス・スマートフォン

- TOP Avatar、WORKS 3D Viewer、Video、Mirrorなどを必要以上に同時実行しない。
- 画面外の3Dコンテンツは停止またはUnloadする。
- WORKSの3Dモデルは必要になった作品だけロードする。
- 動画も必要になるまで読み込みを抑える。
- 3Dモデル・TextureはWeb用に圧縮する。
- 00 Loadingの背景は画像・動画を使わず、固定CSSグラデーションと少数の独立した粒子で構成する。その他の画面の背景は各画面の実装時に仕様と負荷を確認する。

**PC版をメイン体験とします。スマートフォンでも情報量自体は減らしません。**

スマートフォンの負荷対策：

- 3D品質を下げる。
- Particleを減らす。
- Animationを簡略化する。
- Mirror等の負荷が高い表現を簡略化する。

どの端末までThree.jsアバターを必ず表示するか、低性能端末で2DへFallbackするかは未確定です。モデル容量・Texture解像度・初期読込容量・品質段階などの具体的な予算は設計時に整理します。

## 27. 公開・デプロイ

- **GitHub Pagesを利用してデプロイする。**
- **別で利用している既存ドメインのサブドメインを割り当てる。**
- 対象GitHubリポジトリは **`Shio0409/VRC-portfolio`**（公開リポジトリ）。具体的なサブドメイン名、DNS設定先・公開手順は公開設定が必要な段階で確認する。
- GitHubにはWebコード、使用中の素材、本仕様書、`consept`内のコンセプト資料を含める。Unityプロジェクト`siofel 2601`は含めない。
- GitHub Pagesで公開する構成を前提にWebの技術構成を検討する。

この方針の確定は、今回デプロイやDNS変更を実施する指示ではありません。

## 28. 素材・参考資料の対応

パスはプロジェクトルートを基準とします。

| 用途 | 対象 | 状態 |
|---|---|---|
| Loadingサムネイル | `material/playing.png` | ユーザー指定済み・原本確認済み |
| TOPモデルの元 | `siofel 2601`のHierarchy内`Kipfel for portfolio` | ユーザー指定済み・開いているKipfelシーンで存在確認済み |
| TOP外見の基準 | ユーザー提示の三面図と第6項の特徴 | 三面図の実画像は調査時点で未確認 |
| Loadingコンセプト | `consept/0loading.png` | 視覚参考 |
| TOPコンセプト | `consept/1top.png` | 視覚参考 |
| CAREERコンセプト | `consept/02carrer.png` | 視覚参考 |
| CONTACTコンセプト | `consept/04contact.png` | 視覚参考 |
| 共通カーソル normal | `consept/cursor_normal.png` → `web/assets/cursor-normal.svg` | 原本確認済み・Web用に再現 |
| 共通カーソル hover | `consept/cursor_hover.png` → `web/assets/cursor-hover.svg` | 原本確認済み・Web用に再現 |
| WORKSコンセプト | 未用意 | 展示レイアウト未確定 |
| CAREER原稿 | 第15項 | 年表・本文の基準。教室長代理の本文等は保留 |
| CAREER画像 | 未用意 | 別途準備 |
| WORKS正式素材・YouTube動画 | 未確定 | 後回し |
| CONTACT画像・本文・リンク | 未確定 | 別途準備 |
| BGM / SE / 環境音等 | 未用意 | 別途用意する |
| Web用GLB / glTF | 未用意 | 対象アバターから別途準備する |

コンセプトアート4枚は1672×941 pxのPNGです。背景・サムネイル・プロフィール画像などを含む完成画面の参考であり、各部品の独立した実素材が揃っていることを意味しません。

### コンセプトアートの扱い

- Loadingの割合・MB表示は実測値ではなく、固定の仕様値として採用しない。
- TOPのギター・座り姿は、TOPの初期ポーズを確定する根拠にしない。
- TOPの追加ショートカットカードを新たな必須UIにしない。
- CAREER画像内の年号と表示内容の不一致を再現しない。確定原稿と再生時点を一致させる。
- CAREER画像の映像外経歴パネルより、「基本的にメイン画面内に情報を表示する」仕様を優先する。
- CONTACT画像の架空情報、Status、Languages、追加パネル等を確定情報として採用しない。
- 画面ごとに異なるNavigation表現は、そのまま別仕様にせず共通UIとして整理する。

## 29. 未確定事項・確認タイミング

確定済みのアバター対象、Loading画像、主任講師の2022年、教室長代理の2023年を再度未確定扱いしません。以下は必要になった段階で確認します。

| 分類 | 未確定・保留の内容 |
|---|---|
| TOP | 具体的なIdle Pose、ギター所持の有無、Animation内容、確定会話全文 |
| アバター準備 | 指定Hierarchyオブジェクトの保存済みデータとの対応、Web用モデル・Morph・Bone・Textureの選別 |
| Loading | 将来の初期読込対象、TOPアバターが未ロードの場合の最終表示。初回は画像のみを読み込み、完了・SKIPで仮TOPへ進む |
| CAREER | 画像、教室長代理の説明・Keywords等、各項目の再生時間、同年内の詳細調整、音素材の内容 |
| CAREERの旧指定 | 個人オンラインゲーム開発の年・本文・最新原稿への組み込み方 |
| WORKS | 正式素材との対応、各作品のYEAR / CATEGORY / TOOLS / ROLE / DESCRIPTION / LINK、YouTube動画、具体的な展示レイアウト。素材準備は後回し |
| CONTACT | 最終Bio、Status、Languages、URL / Email、プロフィール画像、必要な追加情報の配置 |
| 共通デザイン | Navigationの最終ビジュアル、フォント、背景実素材、各種Iconの具体的な意匠。Cursorは第24項で確定 |
| Sound | Global OFFとプレイヤー音声操作の関係、設定保存の有無・方法、再訪時の復元 |
| スマートフォン | 3D表示を維持する対象端末、低性能端末での2D Fallback、タッチ操作の詳細 |
| 技術構成 | サイト全体への拡張時のFramework・TypeScript・Routing等の採用判断、容量・品質の予算。初回Loadingは依存パッケージなしのES Modules構成 |
| 公開 | サブドメイン名、DNS設定先・公開手順。GitHubリポジトリは`Shio0409/VRC-portfolio`で確定 |

## 30. 初回実装の範囲と状態

仕様統合と旧txt削除の後、ユーザーの承認により **Sound選択 → 00 Loading → 仮TOP** の実装へ進みました。

今回の実装範囲：

- Loadingコンセプトを参考にしたHTML / CSSレイアウト。
- 指定の`material/playing.png`を使用。原本を変更せず、公開用出力へコピーする。
- Sound ON / OFF選択と、画面内からの切り替え。音源の接続は後回し。
- 実画像の転送・デコードと最低2秒を待つLoading。
- 背景画像を使わず、個々の光の粒子が下から上へゆっくり動くCSS表現。PCでは16個、幅700px以下では10個を表示する。
- 速度に緩急のあるProgress Barと、Traveling / Initializingの段階表示。
- 参照画像を基にした全編共通のnormal / hoverカーソル。
- 読込失敗時の再試行、待機を打ち切るSKIP。
- Loading完了・SKIPの移動先としての仮TOPと、確認用のENTRYへ戻る操作。
- PC / スマートフォン向けレイアウト、キーボード操作、動きを減らす設定への対応。
- GitHub Pagesへ配置できる静的ファイル出力。

Progress Barは接続画面全体の準備状況を示します。最低表示時間に沿って加速・減速する演出の進捗と、読込側進捗の小さい方を表示し、画像デコード完了前には100%にしません。読み込みが先に終わった場合は残り時間を進行演出に使います。架空の転送容量・割合は画面に表示しません。後半の段階で画像転送がほぼ完了、またはデコードまで完了したときに、`Traveling to Website...`から`Initializing Website...`へ切り替えます。

Sound設定は現在の画面セッション内のみで管理し、保存・再訪時の復元方針を確定するものではありません。音素材は未接続です。

Unityプロジェクトの編集・保存、アバター変換、TOP本実装、CAREER / WORKS / CONTACTの実装、GitHub Pagesへの公開・DNS変更は今回の作業に含みません。

実行方法・構成・検証方法は`web/README.md`に記載します。
