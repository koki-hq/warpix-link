// ---------- ピクセの ポストカード：いまのピクセを、ドット絵のはがき画像にする ----------
// 画像はブラウザの中だけで作る（canvas）。保存するか、スマホなら共有できる。
const postcard = (() => {
  const W = 1200;
  const H = 630;
  const PX = 18; // ピクセ 1 マスの大きさ

  async function fontsReady() {
    try {
      await Promise.all([
        document.fonts.load('40px "Press Start 2P"'),
        document.fonts.load('30px "DotGothic16"'),
      ]);
    } catch {}
  }

  // CSS 変数の色で、ドット絵を canvas に描く
  function drawSprite(c, rows, x, y, size, palette) {
    rows.forEach((row, j) =>
      [...row].forEach((ch, i) => {
        if (!palette[ch]) return;
        c.fillStyle = palette[ch];
        c.fillRect(x + i * size, y + j * size, size, size);
      })
    );
  }

  // 吹き出しの文字を、決まった幅で折り返す
  function wrap(c, text, maxW) {
    const lines = [];
    for (const para of text.split("\n")) {
      let line = "";
      for (const ch of para) {
        if (c.measureText(line + ch).width > maxW && line) {
          lines.push(line);
          line = ch;
        } else line += ch;
      }
      lines.push(line);
    }
    return lines.slice(0, 3);
  }

  async function render() {
    await fontsReady();
    const css = getComputedStyle(document.body);
    const v = (n) => css.getPropertyValue(n).trim();
    const pal = { o: "#000000", w: v("--fg"), p: v("--accent"), c: v("--accent-2"), y: v("--gold"), k: v("--pumpkin"), v: v("--muted") };
    const cv = document.createElement("canvas");
    cv.width = W;
    cv.height = H;
    const c = cv.getContext("2d");

    // 背景：夜空の方眼と星（いつも同じ並び）
    c.fillStyle = v("--bg");
    c.fillRect(0, 0, W, H);
    c.fillStyle = v("--bg-grid");
    for (let x = 0; x < W; x += 40) c.fillRect(x, 0, 2, H);
    for (let y = 0; y < H; y += 40) c.fillRect(0, y, W, 2);
    let seed = 11;
    const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    // 文字と吹き出しのまわりには星を置かない（句読点に見えてしまうため）
    const clear = (x, y) => (x > 400 && y > 40 && y < 300) || (x > 380 && x < 1060 && y > 300 && y < 460) || y > 530;
    for (let i = 0; i < 80; i++) {
      const color = [pal.w, pal.w, pal.w, pal.c, pal.p][Math.floor(rand() * 5)];
      const big = rand() < 0.2;
      const x = Math.floor((rand() * W) / 4) * 4;
      const y = Math.floor((rand() * H) / 4) * 4;
      if (clear(x, y)) continue;
      c.fillStyle = color;
      c.fillRect(x, y, big ? 8 : 4, big ? 8 : 4);
    }
    // ドットの枠
    c.fillStyle = pal.w;
    c.fillRect(20, 20, W - 40, 8);
    c.fillRect(20, H - 28, W - 40, 8);
    c.fillRect(20, 20, 8, H - 40);
    c.fillRect(W - 28, 20, 8, H - 40);

    // ピクセ（いまの姿と帽子）
    const px = 90;
    const py = 180;
    c.fillStyle = "rgba(0,0,0,0.5)";
    c.fillRect(px + 2 * PX, py + 16 * PX + 6, 12 * PX, 14);
    drawSprite(c, dress(NPC.idle), px, py, PX, pal);

    // 吹き出し：日記の最新の 1 行
    // ポストカードを作ったこと自体の行は、吹き出しに使わない
    const last = grow.state.diary.filter((e) => e.type !== "postcard").at(-1)?.text ?? "はじめまして！";
    c.font = '26px "DotGothic16", monospace';
    const lines = wrap(c, last, 520);
    const bx = 430;
    const by = 330;
    const bw = 600;
    const bh = 40 + lines.length * 40;
    c.fillStyle = v("--bg");
    c.fillRect(bx, by, bw, bh);
    c.fillStyle = pal.w;
    for (const [x, y, w, h] of [[bx, by - 6, bw, 6], [bx, by + bh, bw, 6], [bx - 6, by, 6, bh], [bx + bw, by, 6, bh]]) c.fillRect(x, y, w, h);
    c.fillRect(bx - 30, by + 40, 30, 6); // しっぽ
    c.textBaseline = "top";
    lines.forEach((l, i) => c.fillText(l, bx + 24, by + 22 + i * 40));

    // タイトルと記録
    c.font = '40px "Press Start 2P", monospace';
    c.fillStyle = "#000";
    c.fillText("WARPIX-LINK", 438, 66);
    c.fillStyle = pal.p;
    c.fillText("WARPIX-LINK", 434, 62);
    c.fillStyle = pal.w;
    c.fillText("WARPIX-LINK", 430, 58);

    const age = grow.state.days?.length ?? 1;
    const z = zukan.counts();
    const hi = document.querySelector("[data-hiscore]").textContent;
    c.font = '28px "DotGothic16", monospace';
    c.fillStyle = pal.c;
    c.fillText(grow.stageName(), 432, 132);
    c.font = '22px "DotGothic16", monospace';
    c.fillStyle = pal.w;
    const facts = [
      `あえた ひ ${age}にち`,
      `HI-SCORE ${hi}`,
      `ずかん ${z.got}/${z.total}　じっせき ${achievements.count()}/${achievements.total}`,
    ];
    facts.forEach((f, i) => c.fillText(f, 432, 184 + i * 36));

    const d = today();
    c.font = '18px "Press Start 2P", monospace';
    c.fillStyle = v("--muted");
    c.fillText(`${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`, 70, 560);
    c.textAlign = "right";
    c.fillText("link.warpix.app", W - 70, 560);
    return cv;
  }

  // ---------- 画面 ----------
  let overlay = null;
  const close = () => {
    overlay?.remove();
    overlay = null;
  };

  // canvas の 画像を、ほぞん・シェアできる まどで みせる（ぼうけんの きろくカードも つかう、v1.39）
  async function show(cv, { name, title, alt }) {
    const blob = await new Promise((r) => cv.toBlob(r, "image/png"));
    const url = URL.createObjectURL(blob);
    close();
    overlay = document.createElement("div");
    overlay.className = "postcard";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-label", title);
    overlay.innerHTML = `
      <div class="postcard-box">
        <img class="postcard-img" alt="${alt}" src="${url}">
        <div class="postcard-row">
          <a class="postcard-save" href="${url}" download="${name}">ほぞん</a>
          <button type="button" class="postcard-share">シェア</button>
          <button type="button" class="postcard-close">とじる</button>
        </div>
      </div>`;
    const file = new File([blob], name, { type: "image/png" });
    const share = overlay.querySelector(".postcard-share");
    if (!(navigator.canShare && navigator.canShare({ files: [file] }))) share.hidden = true;
    share.addEventListener("click", async () => {
      try {
        await navigator.share({ files: [file], title, url: "https://link.warpix.app/" });
      } catch {}
    });
    overlay.querySelector(".postcard-close").addEventListener("click", close);
    overlay.addEventListener("click", (e) => e.target === overlay && close());
    document.body.append(overlay);
    overlay.querySelector(".postcard-close").focus({ preventScroll: true });
    sound.sfx.coin();
  }

  async function open() {
    const name = `warpix-pixe-${today().toISOString().slice(0, 10)}.png`;
    await show(await render(), { name, title: "ピクセの ポストカード", alt: `ピクセの ポストカード（${grow.stageName()}）` });
    achievements.unlock("postcard");
    grow.write("postcard", "ポストカードを つくってもらった。");
  }

  addEventListener("keydown", (e) => e.key === "Escape" && overlay && close());
  document.getElementById("postcard-btn").addEventListener("click", () => {
    document.getElementById("diary").close();
    open();
  });
  cheats.add("postcard", open);

  return { render, open, show, drawSprite, fontsReady, isOpen: () => Boolean(overlay) };
})();
