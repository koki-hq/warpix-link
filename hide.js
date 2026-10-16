// ---------- かくれピクセ：まいにち 3 びきの ちびピクセが、ページの どこかから のぞいている ----------
// ばしょは その日で きまる（つぎの日は べつの ばしょ）。ぜんぶ みつけると「かくれんぼ めいじん」。
// ちびピクセは リンクの なかには いれず、ページの うえの べつの そうに おく（リンクを まちがえて おさないように）。
const hide = (() => {
  const KEY = "warpix-hide";
  const COUNT = 3;
  const preview = new URLSearchParams(location.search).has("date");
  const pad2 = (n) => String(n).padStart(2, "0");
  const ymd = (() => { const d = today(); return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`; })();

  const HEAD = [
    "...pp...",
    "..oooo..",
    ".owwwwo.",
    "owowwowo",
    "owpwwpwo",
    "owwwwwwo",
  ];
  // [ID, えらぶ もの, どこから のぞくか, よこの ばしょ（0〜1）]
  const SPOTS = [
    ["title", ".title", "top", 0.86],
    ["subtitle", ".subtitle", "top", 0.08],
    ["moon", "#moon", "left", 0.5],
    ["dialog", "#dialog", "top", 0.9],
    ["link1", ".pixel-btn:not(.secret):nth-of-type(1)", "top", 0.93],
    ["link2", ".pixel-btn:not(.secret):nth-of-type(2)", "right", 0.5],
    ["link3", ".pixel-btn:not(.secret):nth-of-type(3)", "top", 0.06],
    ["link4", ".pixel-btn:not(.secret):nth-of-type(4)", "right", 0.5],
    ["link5", ".pixel-btn:not(.secret):nth-of-type(5)", "top", 0.7],
    ["link6", ".pixel-btn:not(.secret):nth-of-type(6)", "bottom", 0.88],
    ["coin", "#coin-slot", "top", 0.2],
    ["hud", ".hud", "bottom", 0.3],
    ["footer", ".footer-info", "bottom", 0.95],
  ];

  // その日の 3 ばしょ
  function spotsOf(date) {
    let h = 2166136261;
    for (const ch of date) h = Math.imul(h ^ ch.charCodeAt(0), 16777619) >>> 0;
    const pool = [...SPOTS];
    const out = [];
    while (out.length < COUNT) {
      h = Math.imul(h ^ (h >>> 13), 0x5bd1e995) >>> 0;
      out.push(pool.splice(h % pool.length, 1)[0]);
    }
    return out;
  }

  const saved = store.get(KEY, null);
  const state = saved?.date === ymd ? saved : { date: ymd, found: [], wins: saved?.wins ?? 0 };
  const save = () => !preview && store.set(KEY, state);

  const layer = document.createElement("div");
  layer.className = "hide-layer";
  document.body.append(layer);

  const SIZE = 3; // 1 マスの おおきさ
  function place(btn, [, sel, side, f]) {
    const el = document.querySelector(sel);
    const r = el?.getBoundingClientRect();
    if (!r || !r.width || el.closest("[hidden]")) {
      btn.hidden = true;
      return;
    }
    btn.hidden = false;
    const w = 8 * SIZE;
    const h = 6 * SIZE;
    let x;
    let y;
    if (side === "top") [x, y] = [r.left + r.width * f - w / 2, r.top - h + 2];
    else if (side === "bottom") [x, y] = [r.left + r.width * f - w / 2, r.bottom - 2];
    else if (side === "left") [x, y] = [r.left - w + 2, r.top + r.height * f - h / 2];
    else [x, y] = [r.right - 2, r.top + r.height * f - h / 2];
    btn.style.left = `${Math.round(x + scrollX)}px`;
    btn.style.top = `${Math.round(y + scrollY)}px`;
    btn.classList.toggle("flip", side === "bottom");
    btn.classList.toggle("side-left", side === "left");
    btn.classList.toggle("side-right", side === "right");
  }

  let buttons = [];
  function build() {
    layer.replaceChildren();
    buttons = spotsOf(ymd)
      .filter(([id]) => !state.found.includes(id))
      .map((spot) => {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "hide-pixe";
        b.setAttribute("aria-label", "かくれている ちびピクセ");
        b.innerHTML = pixelSvg(HEAD);
        b.addEventListener("click", (e) => find(spot, b, e));
        layer.append(b);
        return [b, spot];
      });
    reposition();
  }
  function reposition() {
    for (const [b, spot] of buttons) place(b, spot);
  }

  function find([id], btn, e) {
    if (state.found.includes(id)) return;
    state.found.push(id);
    const n = state.found.length;
    btn.classList.add("found");
    btn.disabled = true;
    setTimeout(() => btn.remove(), 500);
    buttons = buttons.filter(([b]) => b !== btn);
    score.add(50, e.clientX || innerWidth / 2, e.clientY || innerHeight / 2);
    sound.sfx.coin();
    emit("hide-found", { id, n });
    if (n >= COUNT) {
      state.wins++;
      npc.say(["ぜんぶ みつかっちゃった！\nかくれんぼ、きみの かち！", "あしたは べつの ところに かくれるからね。"]);
      achievements.unlock("hideseek");
      grow.write("hide", "かくれんぼで ちびピクセを 3びき ぜんぶ みつけた。");
    } else {
      npc.say([`みつかっちゃった！（${n}/${COUNT}）\nまだ どこかに いるよ。`]);
    }
    save();
  }

  // ときどき 1 ぴきだけ ひっこむ（ページが ねむっている・うらの とき・うごきを へらす ときは しない）
  setInterval(() => {
    if (reduceMotion || document.hidden || dozing() || !buttons.length) return;
    const [b] = buttons[Math.floor(Math.random() * buttons.length)];
    b.classList.add("duck");
    setTimeout(() => b.classList.remove("duck"), 800);
  }, 6000);

  on("boot", () => {
    if (simple.on) return;
    // リンクが すべりこんでくる まで まってから おく
    setTimeout(build, reduceMotion ? 100 : 1800);
  });
  addEventListener("resize", () => buttons.length && reposition());
  // ふきだしの おおきさなどで ならびが かわったら おきなおす
  new ResizeObserver(() => buttons.length && reposition()).observe(document.querySelector("main") ?? document.body);

  return { spotsOf, state, reposition, left: () => buttons.length };
})();
