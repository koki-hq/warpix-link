// ---------- せつめいしょ（v2.0）：はじめての 人だけ、リンクの 画面の うえに かさねる ----------
// 本人「起動画面もいらない　いきなりリンクの画面でおけ　で、初めての人にはその画面の上に説明書出す感じでおけ」。
// ⚙️ の「アプリ」から いつでも もう いちど みられる
const manual = (() => {
  const dialog = document.getElementById("manual");
  function open() {
    dialog.showModal();
    document.getElementById("manual-start").focus();
  }
  document.getElementById("manual-start").addEventListener("click", () => {
    store.set(KEY.manual, true);
    dialog.close();
    sound.sfx.select();
  });
  dialog.addEventListener("cancel", () => store.set(KEY.manual, true));
  return { open, seen: () => store.get(KEY.manual, false) === true };
})();

// ---------- はじまり ----------
(() => {
  // 空の かざり（ほし・くも・たいよう）。どれを みせるかは CSS が data-sky で きめる
  const sky = document.getElementById("sky");
  const STARS = [[8, 9, 3], [22, 4, 2], [35, 13, 3], [51, 6, 2], [64, 16, 2], [79, 8, 3], [91, 14, 2], [14, 22, 2], [43, 26, 2], [71, 24, 3], [87, 30, 2], [5, 36, 2], [28, 33, 3], [58, 38, 2], [95, 42, 2], [18, 48, 2], [48, 52, 2], [76, 56, 3], [10, 66, 2], [62, 72, 2], [34, 80, 2], [88, 86, 2]];
  const CLOUD = [".....####.......", "...########.....", "..###########...", ".##############.", "################", ".##############."];
  const SUN = ["...####...", ".########.", ".########.", "##########", "##########", "##########", "##########", ".########.", ".########.", "...####..."];
  sky.innerHTML =
    STARS.map(([x, y, s], i) => `<i class="star${i % 4 === 0 ? " dim" : ""}" style="left:${x}%;top:${y}%;width:${s}px;height:${s}px"></i>`).join("") +
    `<span class="cloud c1">${pixelSvg(CLOUD, { "#": "#fff" })}</span><span class="cloud c2">${pixelSvg(CLOUD, { "#": "#fff" })}</span>` +
    `<span class="sun">${pixelSvg(SUN, { "#": "#ffd27a" })}</span>`;

  // ピクセの あいさつ
  // グループが まだ ない 人には つくる ことを すすめる（はじめての 日の じこしょうかいは そのまま）
  pixe.say(groups.list().length || pixe.firstVisit ? pixe.greeting() : "まだ リンクが ないね。\nいっしょに つくろう！");

  // はじめての 人には せつめいしょ
  if (!manual.seen() && window.WARPIX_MANUAL !== false) manual.open();

  // BGM は さいしょに さわった ときから（ブラウザが かってに 音を ださせて くれない）
  const start = () => {
    if (settings.state.bgm && !sound.playing()) sound.bgmPlay(0.1);
  };
  addEventListener("pointerup", start, { once: true });
  addEventListener("keydown", start, { once: true });

  // うらに まわったら 音を とめ、もどったら つくりなおす
  document.addEventListener("visibilitychange", () => (document.hidden ? sound.pause() : sound.resume()));
})();
