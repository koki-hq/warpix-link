# warpix-link

ピクセルアート・レトロゲーム・チップチューンの雰囲気でまとめた、1ページのリンク集です。
ビルド不要の素の HTML / CSS / JavaScript だけで動きます。

## 特徴

- **PRESS START 画面**：クリックか Enter でスタートし、起動ジングルが鳴ってページが立ち上がる
- **起動アニメーション**：タイトルが落ちてきて、リンクボタンが1つずつ出てくる（`steps()` でカクカク動く）
- **流れる星**：背景に canvas で描いたドットの星が縦スクロールで流れる
- **ドット絵アイコン**：12×12 マスのアイコンを JS の文字列から SVG にして表示
- **チップチューン BGM**：Web Audio API で鳴らす4小節ループ。右上のボタンで ON/OFF でき、設定はブラウザに保存される
- **効果音**：ボタンにマウスを乗せたとき・クリックしたときに 8bit 風の音が鳴る
- **アクセシビリティ**：OS で「動きを減らす」を設定していると、星は止まり、アニメーションはすぐ終わる

## ファイル構成

```
index.html   ページ本体（リンクの中身はここ）
style.css    見た目（色・ボタン・アニメーション）
script.js    アイコン、サウンド、星、PRESS START 画面
docs/THEME.md  デザインのテーマと決まりごと
```

## 見かた

`index.html` をブラウザで開くだけで動きます。
ローカルサーバーで見たい場合は、たとえば次のようにします。

```sh
npx serve .
# または
python -m http.server
```

フォントは Google Fonts（Press Start 2P / DotGothic16）から読み込むので、表示にはネット接続が必要です。

## カスタマイズ

### リンクを変える・増やす

`index.html` の `<nav class="links">` の中に、1リンクにつき1つ `<a>` を書きます。

```html
<a class="pixel-btn" href="https://www.youtube.com/@yourname" target="_blank" rel="noopener">
  <span class="arrow">▶</span><span class="icon" data-icon="youtube"></span>YOUTUBE
</a>
```

- `href`：リンク先
- `data-icon`：使うアイコンの名前（`script.js` の `ICONS` のキー）
- 最後の文字：ボタンに表示する名前

出てくる順番のアニメーションは、並び順から自動で決まります。

### アイコンを描く・直す

`script.js` の `ICONS` に、12文字 × 12行で描きます。`#` が塗り、`.` が透明です。

```js
heart: [
  "............",
  "..##....##..",
  ".####..####.",
  // ...あと9行
],
```

色はボタンのアイコン色（`style.css` の `.pixel-btn .icon`）で決まります。

### 色を変える

`style.css` の先頭の `:root` にある変数を変えます。各色の役割は [docs/THEME.md](docs/THEME.md) にまとめています。

### BGM を変える

`script.js` の `sound` の中にある次の値を変えます。

- `BPM`：テンポ
- `LEAD`：メロディ。8分音符ごとの MIDI ノート番号（60 = 真ん中のド）、`null` は休符
- `BASS`：1小節ごとのベースの根音（MIDI ノート番号）

`LEAD` の長さを変えたら、`BASS` の数を「`LEAD` の長さ ÷ 8」に合わせてください。
