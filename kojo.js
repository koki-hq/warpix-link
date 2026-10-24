// ---------- ひみつの こうじょう（v1.43）：ワープゾーンの いきさき ----------
// まえは ワープゾーンを おすと いきなり GitHub（プログラムの おきば）が ひらいて、ふつうの ひとには なにが おきたか わからなかった（おたより #2）。
// いまは アプリの なかの「ひみつの こうじょう」に つく。まどを とじると、ワープ ダイブの ピクセが かえってくる。
// v1.58：ソースコードは みせない（本人「ふせげる リスクは ふせいだ ほうが いい」）。かわりに みたい ひと だけ「かくしコマンドを みる」
const kojo = (() => {
  const link = document.getElementById("secret-link");
  const dialog = document.getElementById("kojo");
  const $ = (id) => document.getElementById(id);
  // せっけいずの いろの ピクセ（あおい かみに しろい せん）
  const BLUEPRINT = { o: "#bfe9ff", w: "#1d3b8a", p: "#bfe9ff", c: "#ffffff", y: "#ffd84a", v: "#bfe9ff", k: "#bfe9ff" };

  // いまの 版（サービスワーカーの VERSION から。オフラインでも キャッシュから よめる）
  async function version() {
    try {
      const text = await (await fetch("sw.js")).text();
      return text.match(/warpix-v(\d+\.\d+)/)?.[1] ?? null;
    } catch {
      return null;
    }
  }

  // かくしコマンド集：うつ ことば と おきる こと
  const CHEATS = [
    ["gameboy", "なつかしい ゲームきの いろに なる（もういちど うつと もどる）"],
    ["party", "パーティー タイム！ ほしが おどる"],
    ["pixe", "ピクセの あめが ふる。つかまえてみて"],
    ["warp", "ハイパー ワープ"],
    ["invaders", "ミニゲーム PIXE INVADERS"],
    ["adventure", "ピクセと ぼうけんに でる"],
    ["credits", "スタッフロール"],
    ["rest", "ピクセと いっしょに とおくを みて めを やすめる"],
    ["help", "じっせきの ヒントを ひとつ"],
    ["simple", "リンクだけの しずかな ページ（もどるは みぎうえの ▶ あそぶ）"],
    ["omikuji", "ピクセの おみくじ"],
    ["postcard", "ピクセの ポストカード"],
    ["atelier", "ぼうしを じぶんで かく"],
    ["compose", "ピクセと さっきょく"],
    ["zukan", "ピクセの ずかん"],
    ["rta", "ぼうけんの きろくカード"],
    ["settings", "せってい"],
    ["kojo", "この こうじょう"],
    ["↑↑↓↓←→←→BA", "でんせつの コマンド（キーボード）"],
    ["pixe()", "かいはつしゃツールの コンソールで うつと……"],
  ];
  function showCheats(on) {
    $("kojo-main").hidden = on;
    $("kojo-cheats").hidden = !on;
    if (on) {
      $("kojo-list").innerHTML = CHEATS.map(([w, d]) => `<dt><code>${w}</code></dt><dd>${d}</dd>`).join("");
      $("kojo-cheats-back").focus();
    } else $("kojo-cheats-btn").focus();
  }
  $("kojo-cheats-btn").addEventListener("click", () => {
    sound.sfx.select();
    showCheats(true);
  });
  $("kojo-cheats-back").addEventListener("click", () => showCheats(false));

  async function open() {
    showCheats(false);
    const warps = Object.values(store.get("warpix-links", {})).reduce((a, s) => a + (s?.n ?? 0), 0);
    const days = grow.state.days?.length ?? 1;
    $("kojo-pixe").innerHTML = pixelSvg(NPC.idle, BLUEPRINT);
    $("kojo-days").textContent = `${days}にち`;
    $("kojo-warps").textContent = `${warps}かい`;
    $("kojo-version").textContent = "…";
    dialog.showModal();
    $("kojo-back").focus();
    const v = await version();
    $("kojo-version").textContent = v ? `v${v}` : "？";
    emit("seen", { id: "kojo" });
  }

  function close() {
    dialog.close();
    // ワープ ダイブの とちゅうなら、「むこうに いって きた」ことに して かえってくる
    const trip = typeof warpDive !== "undefined" ? warpDive.trip() : null;
    if (trip && trip.icon === "key") {
      trip.left = true;
      warpDive.back();
    }
  }

  // ワープゾーンを おしたら、そとへは とばずに こうじょうへ（シンプルモードでも おなじ）
  link.addEventListener("click", (e) => {
    e.preventDefault();
    // ピクセが あなに とびこむ のを まってから つく。ダイブ しない とき（うごきを へらす など）は すぐ
    const trip = typeof warpDive !== "undefined" ? warpDive.trip() : null;
    if (trip && trip.icon === "key") {
      clearTimeout(trip.timer); // こうじょうに いる あいだは もどって こない
      setTimeout(open, 750);
    } else {
      open();
    }
  });
  $("kojo-back").addEventListener("click", close);
  $("kojo-close").addEventListener("click", close);
  dialog.addEventListener("cancel", (e) => {
    e.preventDefault();
    close();
  });
  dialog.addEventListener("click", (e) => e.target === dialog && close());

  cheats.add("kojo", open);
  return { open, close };
})();
