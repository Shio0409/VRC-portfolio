# アバターのWeb書き出し準備

2026-09-12にUnity MCPを通じて実行。対象は`Kipfel`シーンの`/Kipfel for portfolio`です。

## 現在の成果

確認用GLBはローカルの`web/.local/avatar/kipfel-web-preview-1k.glb`にあります。公開サイトのビルドやGitには含めていません。

| 項目 | 結果 |
|---|---|
| 元の書き出し | 246,149,188 bytes |
| テクスチャ最適化後 | 14,751,980 bytes（約14.8MB） |
| メッシュ / スキン | 14 / 12 |
| スキンが参照する固有ジョイント | 91 |
| 三角形 | 72,513 |
| 描画プリミティブ | 19 |
| マテリアル / テクスチャ | 11 / 11 |
| テクスチャ | すべて1024×1024 PNG |
| Morph Target | メッシュ単位の合計445（顔Bodyだけで372） |
| Animation Clip | 0。TOPのポーズ・アニメーションは未確定 |
| 公式Validator | エラー0、警告12、情報129。省略なし |

警告12件は`NODE_SKINNED_MESH_NON_ROOT`です。スキン付きメッシュが階層の子にあるため、親の変換だけで表示を制御する想定を置かず、Three.jsで骨とメッシュの挙動を確認する必要があります。見た目・実機描画はまだ検証していません。

最適化前後でnodes / meshes / skins / accessors / scenes / textures / materialsが同一であることと、画像以外の1,899個のbufferViewがバイト単位で同一であることを確認しました。画像だけを縮小・再圧縮しています。

## Unity側で確認した構成

- Unity 2022.3.22f1、MCP `http://127.0.0.1:27283/mcp`。CLI上のprojectNameは`for music 2511`ですが、projectRootは本プロジェクトの`siofel 2601`です。
- シーンは`Assets/MOCHIYAMA/Kipfel/Kipfel.unity`。元Prefabは`Assets/MOCHIYAMA/Kipfel/Prefab/Kipfel.prefab`ですが、書き出し対象はカスタマイズ済みのHierarchyオブジェクトです。
- Renderer 14（SkinnedMeshRenderer 12、MeshRenderer 2）、主にlilToon系の11マテリアル。
- 髪は`AOS/looseShort_kip`、パンツ・靴・靴下は`MOCHIYAMA_Clothes/NoranekoCargo`。ベスト・シャツは`atelier-kotone/kipfel/amikomi/texture/blue.png`を参照。
- PhysBone 39、PhysBoneCollider 18、Unity Constraint 6、VRChat Constraint 4、Contact Receiver 2 / Sender 1。
- Modular AvatarのMerge Armature / Merge AnimatorとAvatar Optimizerのメッシュ除去を使用。NDMF処理成功を確認してから書き出しています。
- 現在のHierarchyではギターが有効なので確認用GLBにも含まれます。TOPでの所持やIdle Poseを確定するものではありません。

## 書き出し方法

エクスポーターは[Khronos UnityGLTF](https://github.com/KhronosGroup/UnityGLTF/tree/release/2.14.1) 2.14.1、取得コミット`b99d85f0b6d5a20ebc2d5a78158f92f938e8438a`を使用しました。ローカル取得先は`web/.local/UnityGLTF`で、UnityのUPMからfile参照しています。このフォルダを削除するとUnityの参照が切れます。

Unityに追加する前のmanifestとpackages-lockは`web/.local/unity-manifest.before-gltf.json`と`web/.local/unity-packages-lock.before-gltf.json`へ保存しました。UnityGLTFと依存パッケージ追加後のコンパイルは成功しています。

1. 対象シーンを開き、Play Modeを終了します。
2. `isuzu-unity-cli call execute_code --file <export-preview.csの絶対パス>`を実行します。
3. jobIdが返った場合は`isuzu-unity-cli jobs <jobId>`で完了を確認します。再実行すると別の書き出しを開始するので、進行中のジョブを重複実行しません。
4. 完了応答に書かれた日時付きGLBを入力として、次の最適化・検証を行います。

`export-preview.cs`は一時的な別シーンの複製上でNDMFを処理し、生成アセットはメモリ内に保持します。元マテリアルを変更せず、複製側だけをStandard PBRへ置き換えます。終了時に複製・一時マテリアル・一時シーンを破棄します。NDMFの内部APIを使用しているため、NDMF更新時には互換性を再確認してください。

今回、パッケージ導入前は元シーンがclean、導入後はdirtyになっていました。元シーンを保存・再読込していません。GLB書き出し直前と直後のdirty状態はいずれもtrueで、元シーンの未保存状態を保持しています。既存ログのVPMによるMCP package.jsonのauthor形式エラーは残っていますが、コンパイルエラーは0です。

## 画像最適化・検証

ツール用依存はWebランタイムとは別です。`sharp`と[Khronos glTF Validator](https://github.com/KhronosGroup/glTF-Validator/tree/main/node)をローカル環境に用意します。別ディレクトリにある場合、`AVATAR_SHARP_MODULE`と`AVATAR_VALIDATOR_MODULE`へ各パッケージの絶対パスを指定できます。今回のvalidatorは`2.0.0-dev.3.10`です。

プロジェクトルートで実行します。

```sh
node web/tools/avatar/optimize-glb.mjs input.glb output.glb 1024
node web/tools/avatar/validate-glb.mjs output.glb report.json
```

最適化ツールは単一バッファのGLBと埋め込みPNGを対象とし、別の出力ファイルを作ります。メッシュやスキンの数値データを変更しません。既存出力の上書きは拒否します。

## 本番モデルまでに必要な作業

### 表情・ポーズ・選択クリップの書き出し

`web/.local/avatar/animation-selection.json`がある場合、書き出し時にその指定を適用します。省略時は従来の静的GLBです。JSONの形式：

```json
{
  "clips": [{ "path": "Assets/MOCHIYAMA/Kipfel/Animation/CatEar/kipfel_CatEar_idle.anim", "name": "kipfel_CatEar_idle" }],
  "expressions": [{ "path": "Body", "name": "eye_close", "weight": 50 }],
  "pose": []
}
```

これは検証用の例で、TOPへの採用指定ではありません。clipsはアセットパスとクリップ名の完全一致。expressionsのweightはUnityの0〜100基準。poseは`path`, `x`, `y`, `z`でNDMF処理後の対象TransformのローカルEuler角（度、絶対値）を指定します。すべて複製上にのみ適用します。

骨のTransformとBlendShapeのカーブを対象とし、処理後に消えたパス、マテリアル差し替え、対応外のプロパティはエラーとして停止します。HumanoidクリップはUnityGLTFの処理に渡しますが、個別の再生検証が必要です。VRChatのController、遷移条件、PhysBoneの挙動をそのまま移植するものではありません。

2026-09-13：既存の`kipfel_CatEar_idle`を選択した検証GLBで、1アニメーション・4チャンネルと`Body / eye_close`の0.5を確認しました。これは静止キーのクリップであり、連続した動きの再生検証はまだです。glTF Validatorは0 errors / 17 warnings（既存のスキン階層12件、原寸PNGの機能に関する5件）。検証用ファイルはローカルに保持し、現在の1Kプレビューは置き換えていません。

頭のローカルX回転を5度に指定した別の検証GLBでも、HeadノードのQuaternionが約`[0.0436194, 0, 0, 0.9990482]`になることを確認しました。形式検証は0 errors / 17 warnings。最終ポーズや実際に採用する連続アニメーションの見た目は別途検証します。

### 黒ずみと照明の調整

2026-09-13：基本法線の長さは各頂点で約1、ゼロ長なし。環境光を加えても肩の黒ずみが残りましたが、PBRマテリアルの頂点カラー乗算を無効にすると解消しました。ビューアーでは乗算を初期OFFにし、比較用チェックを追加しています。GLB自体の頂点カラーは保持します。補助環境光も0〜4で調整可能です。テクスチャ解像度はユーザー確認により現状の1Kを維持します。

### ローカルThree.jsビューアー

```sh
node web/tools/avatar/setup-viewer.mjs
node web/tools/serve.mjs --avatar --port 4174
```

`http://127.0.0.1:4174/avatar/`を開きます。Three.js 0.180.0を公式npm配布から取得し、固定SHA-512を確認してローカルに展開します。展開には`tar`が必要です。ブラウザから外部CDNへ接続しません。

モデルは`web/.local/avatar/kipfel-web-preview-1k.glb`を使用します。正面・側面・背面、PBR/Unlit、骨の表示、単一骨のX軸回転、表情の強さを操作できます。操作はメモリ上のみで、モデルを保存・変更しません。表情は同じglTFメッシュから分割された全プリミティブへ適用します。GPUには元から有効な表情と選択した表情だけを渡し、全445個の同時アップロードを避けます。

描画はカメラ操作・入力・サイズ変更時のみです。スマートフォンは横向きで同じ操作項目を表示し、縦向きでは共通のorientation gateで操作を止めます。実機での性能検証は未実施です。

`--avatar`を付けない通常サーバーと`--dist`では確認画面・モデル・Three.jsを配信しません。ビルドにも含めません。UnityとGLBは引き続きGit管理対象外です。

### ブラウザで確認した結果（2026-09-13）

- 全身・側面・背面を表示。Three.js上では19個の描画メッシュ、91骨、445個のShape Key、Animation Clipなし。
- `Body / eye_close`を1にして両目の閉じを確認。
- `LowerArmL`をローカルX軸で30度曲げ、手と袖の追従を確認。すべての骨・表情・組み合わせを検証したものではありません。
- 修正後の上記操作中、ブラウザログにエラー・警告なし。
- 当初は肩・ベストの縁に黒ずみを確認。後続調査で頂点カラー乗算の影響を特定し、ビューアーで除外しました（上記参照）。
- 844×390の横画面サイズでモデルとスクロール可能な操作パネルを確認。実機のタッチ操作・GPU性能の確認は未実施。
- 公開ビルドは従来の11ファイル。`--dist --avatar`でも確認画面・モデル・Three.jsが404になることと、開発サーバーでも許可していないローカルファイルが404になることをHTTPで確認。
- 表示はTポーズとギターあり。TOPの最終姿勢・ギター採用を確定するものではありません。

- 残りの骨・表情、透過部、複数の変形を組み合わせた衣装の追従を確認する。
- lilToonの輪郭線、陰影、MatCap、発光等をWeb向けに再構成する。現GLBは色と主テクスチャを受け渡すPBR基準モデルで、lilToonの完全再現ではない。
- 顔の372個を含むMorph Targetを、必要な表情・瞬き等に選別する。現状のまま全端末で軽快に動くとは判断しない。
- PhysBone・Constraint・ContactはGLBの動作として移植されない。必要な揺れ・制御をWeb側で実装する。
- ギターの有無、Idle Pose、必要なAnimation Clipを確定する。現時点でVRChatのAnimator Controller全体は書き出さない。
- 画質を確認しながらテクスチャ解像度・メッシュ・骨・描画回数を調整し、PCとスマホ横画面で負荷を計測する。

書き出し用コードと準備状況はGit管理します。Unityプロジェクト、エクスポーター本体、確認用GLBはローカル作業領域に保持します。サイトで採用する最終モデルの配置は別途行います。
