// ---------- ピクセ RTA（v1.39）：ぼうけんの きろくカードと、おなじ そらの はやさくらべ ----------
// ぼうけんの コースは 日がわり（その 日は だれでも おなじ。ただし 足場は 画面の 大きさで かわる）。
// クリアすると ピクセが「きろくカード」を つくるか きく。カードは 日付・タイム・ベスト・ゴーストとの 差の はいった 画像で、
// ほぞん・シェアできる（#ピクセRTA）。オンラインの ときは、おなじ そらの ひとに タイムだけ しらせあう（なまえは おくらない）。
const rta = (() => {
  const KEY = "warpix-rta"; // { course, best, device, ghostDiff, sky }（その 日の ぶんだけ）
  const W = 1200;
  const H = 630;
  const pad2 = (n) => String(n).padStart(2, "0");
  const courseId = () => { const d = today(); return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`; };
  const device = () => (innerWidth < 700 ? "SMARTPHONE" : "PC");
  const peek = () => /[?&]date=/.test(location.search); // ?date= で のぞいて いる ときは ほぞん しない
  const load = () => {
    const s = store.get(KEY, null);
    return s && s.course === courseId() ? s : { course: courseId(), best: null, device: null, ghostDiff: null, sky: null };
  };
  let state = load();
  const save = () => !peek() && store.set(KEY, state);

  // ---------- きろくカード ----------
  async function render() {
    await postcard.fontsReady();
    const css = getComputedStyle(document.body);
    const v = (n) => css.getPropertyValue(n).trim();
    const pal = { o: "#000000", w: v("--fg"), p: v("--accent"), c: v("--accent-2"), y: v("--gold"), k: v("--pumpkin"), v: v("--muted"), R: v("--cos-red"), G: v("--cos-green"), D: v("--cos-deep"), B: v("--cos-brown"), N: v("--cos-navy") };
    const cv = document.createElement("canvas");
    cv.width = W;
    cv.height = H;
    const c = cv.getContext("2d");
    c.fillStyle = v("--bg");
    c.fillRect(0, 0, W, H);
    c.fillStyle = v("--bg-grid");
    for (let x = 0; x < W; x += 40) c.fillRect(x, 0, 2, H);
    for (let y = 0; y < H; y += 40) c.fillRect(0, y, W, 2);
    // ゴールの はた みたいな チェック
    for (let i = 0; i < W / 40; i++) {
      c.fillStyle = i % 2 ? pal.w : "#000";
      c.fillRect(i * 40, 0, 40, 20);
      c.fillStyle = i % 2 ? "#000" : pal.w;
      c.fillRect(i * 40, H - 20, 40, 20);
    }
    // ピクセ（いまの 姿と 帽子）
    c.fillStyle = "rgba(0,0,0,0.5)";
    c.fillRect(90 + 36, 170 + 16 * 18 + 6, 12 * 18, 14);
    postcard.drawSprite(c, dress(NPC.idle), 90, 170, 18, pal);

    c.textBaseline = "top";
    const shadowText = (text, x, y, color) => {
      c.fillStyle = "#000";
      c.fillText(text, x + 6, y + 6);
      c.fillStyle = pal.p;
      c.fillText(text, x + 3, y + 3);
      c.fillStyle = color;
      c.fillText(text, x, y);
    };
    c.font = '40px "Press Start 2P", monospace';
    shadowText("PIXE RTA", 430, 70, pal.w);
    c.font = '22px "Press Start 2P", monospace';
    c.fillStyle = pal.c;
    c.fillText(`COURSE ${state.course}`, 434, 140);
    c.font = '96px "Press Start 2P", monospace';
    shadowText(adventure.fmtTime(state.best), 430, 200, pal.y);
    c.font = '26px "DotGothic16", monospace';
    c.fillStyle = pal.w;
    const facts = [];
    if (state.ghostDiff !== null && state.ghostDiff < 0) facts.push(`ゴーストに ${(-state.ghostDiff).toFixed(2)}びょう かった`);
    const allBest = store.get("warpix-adv-best", null);
    if (allBest !== null) facts.push(`じこベスト ${adventure.fmtTime(allBest)}`);
    if (state.sky !== null) facts.push(`おなじ そらの きょうの いちばん ${adventure.fmtTime(state.sky)}`);
    facts.forEach((f, i) => c.fillText(f, 434, 340 + i * 42));
    // したの はし：画面の しゅるい（足場が かわるので）と ハッシュタグ、じゅうしょ
    c.font = '18px "Press Start 2P", monospace';
    c.fillStyle = pal.v;
    const dev = state.device ?? device();
    c.fillText(dev, 70, 560);
    const tagX = 70 + c.measureText(dev).width + 30;
    c.font = '24px "DotGothic16", monospace';
    c.fillStyle = pal.c;
    c.fillText("#ピクセRTA", tagX, 556);
    if (ticket.has()) {
      c.fillStyle = pal.y;
      c.fillText("★1きせい", tagX + c.measureText("#ピクセRTA").width + 24, 556);
    }
    c.font = '18px "Press Start 2P", monospace';
    c.fillStyle = pal.v;
    c.textAlign = "right";
    c.fillText("link.warpix.app", W - 70, 560);
    return cv;
  }

  async function open() {
    if (state.best === null) {
      npc.say(["きょうは まだ ぼうけんを\nクリア してないよ。", "クリア したら、きろくカードを\nつくろうね！"]);
      return;
    }
    await postcard.show(await render(), {
      name: `warpix-rta-${state.course}.png`,
      title: "ピクセ RTA の きろくカード",
      alt: `ピクセ RTA の きろくカード（${state.course}、タイム ${adventure.fmtTime(state.best)}）`,
    });
    achievements.unlock("rta-card");
    grow.write("rta-card", `ぼうけんの きろくカードを つくった。${adventure.fmtTime(state.best)}。`);
  }

  // ピクセが ひまに なって、ほかの まどが ひらいて いない ときに きく（スタッフロールの あとでも）
  function offer() {
    const timer = setInterval(() => {
      if (playing() || !npc.free() || npc.busy() || simple.on || postcard.isOpen()) return;
      if (document.querySelector(".credits, dialog[open], .postcard")) return;
      clearInterval(timer);
      npc.ask("きょうの きろく、\nカードに する？", ["つくる", "いい"]).then((i) => {
        if (i === 0) open();
        else if (i === 1) npc.say(["わかった！"]); // ことわっても、きいた ことばが のこらない ように
      });
    }, 800);
    setTimeout(() => clearInterval(timer), 60000);
  }

  on("adventure-clear", ({ time, vsGhost }) => {
    state = load();
    const isBest = state.best === null || time < state.best;
    if (isBest) {
      state.best = time;
      state.device = device();
      state.ghostDiff = vsGhost;
      if (state.sky === null || time < state.sky) state.sky = online.enabled ? time : null;
      save();
      if (online.enabled) online.send("rta", { course: state.course, time });
    }
    offer();
  });

  // ---------- おなじ そらの ひとの タイム ----------
  function receive({ course, time }) {
    if (course !== courseId() || typeof time !== "number" || !(time > 3) || time > 600) return;
    state = load();
    if (state.sky !== null && time >= state.sky) return;
    state.sky = time;
    save();
    if (!document.body.classList.contains("booted") || playing() || simple.on || npc.busy()) return;
    npc.say([`おなじ そらの だれかが\nきょうの コースを ${adventure.fmtTime(time)} で クリア！`]);
  }
  if (online.enabled) online.listen("rta", receive);

  cheats.add("rta", open);
  return { open, render, receive, state: () => state };
})();
